from flask import Flask, request, jsonify
import subprocess
import os
import logging
import datetime

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Directory for incoming jobs and printer name
JOB_DIR = "/home/pi/print_jobs"
PRINTER_NAME = "EPSON_L3210_Series"
# Ensure job directory exists
os.makedirs(JOB_DIR, exist_ok=True)

def get_printer_status():
    """
    Run lpstat to fetch the printer's status.
    Returns detailed status information about the printer.
    """
    try:
        # Check printer status using lpstat
        status_cmd = ["lpstat", "-p", PRINTER_NAME]
        status_result = subprocess.run(status_cmd, capture_output=True, text=True)
        
        # Check queue length using lpstat -o
        queue_cmd = ["lpstat", "-o"]
        queue_result = subprocess.run(queue_cmd, capture_output=True, text=True)
        
        # Count queue jobs for this printer
        queue_length = 0
        if queue_result.returncode == 0:
            for line in queue_result.stdout.strip().split('\n'):
                if PRINTER_NAME in line and line.strip():
                    queue_length += 1
        
        # Check for errors or determine status
        if status_result.returncode != 0:
            status = "ERROR"
            message = status_result.stderr.strip()
            app.logger.warning("Printer status check failed: %s", message)
        else:
            status_output = status_result.stdout.strip()
            app.logger.info("Raw printer status output: %s", status_output)
            
            # More comprehensive status detection
            status_output_lower = status_output.lower()
            if "disabled" in status_output_lower or "not available" in status_output_lower:
                status = "OFFLINE"
                message = "Printer is disabled or not available"
            elif "waiting for printer to become available" in status_output_lower:
                status = "OFFLINE"
                message = "Printer is physically disconnected or turned off"
            elif "idle" in status_output_lower:
                status = "ONLINE"
                message = "Printer is idle and ready"
            elif "printing" in status_output_lower:
                status = "ONLINE"
                message = "Printer is currently printing"
            elif "ready" in status_output_lower:
                status = "ONLINE"
                message = "Printer is ready"
            elif "online" in status_output_lower:
                status = "ONLINE"
                message = "Printer is online"
            elif "offline" in status_output_lower:
                status = "OFFLINE"
                message = "Printer is offline"
            elif "error" in status_output_lower or "failed" in status_output_lower:
                status = "ERROR"
                message = "Printer has an error"
            elif "maintenance" in status_output_lower or "service" in status_output_lower:
                status = "MAINTENANCE"
                message = "Printer needs maintenance"
            else:
                # If we can't determine the status but got a response, assume ONLINE
                status = "ONLINE"
                message = f"Printer status unclear, assuming online. Raw output: {status_output}"
                app.logger.warning("Unclear printer status, defaulting to ONLINE: %s", status_output)
        
        # Get ink levels if possible (this is printer-specific and may require additional tools)
        try:
            ink_cmd = ["ink", "-p", PRINTER_NAME]  # This command is theoretical and depends on your system
            ink_result = subprocess.run(ink_cmd, capture_output=True, text=True, timeout=2)
            ink_levels = ink_result.stdout.strip() if ink_result.returncode == 0 else "Unknown"
        except (subprocess.SubprocessError, FileNotFoundError):
            ink_levels = "Not available"
        
        result = {
            "status": status,
            "message": message,
            "queueLength": queue_length,
            "inkLevels": ink_levels,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        app.logger.info("Printer status result: %s", result)
        return result
    except Exception as e:
        app.logger.exception("Error getting printer status")
        return {
            "status": "ERROR",
            "message": str(e),
            "queueLength": 0,
            "inkLevels": "Unknown",
            "timestamp": datetime.datetime.now().isoformat()
        }

@app.route('/print', methods=['POST'])
def handle_print():
    """
    Accepts a multipart form with a file and print options.
    """
    if 'file' not in request.files:
        return jsonify(error="No file part in the request"), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify(error="No selected file"), 400

    # Extract options from form data
    copies = request.form.get('copies', '1')
    orientation = request.form.get('orientation', 'PORTRAIT').lower()
    color = request.form.get('color', 'false').lower() == 'true'
    media = request.form.get('media', 'A4')
    
    filename = f"{os.urandom(8).hex()}_{file.filename}"
    file_path = os.path.join(JOB_DIR, filename)

    try:
        file.save(file_path)

        # Build the lp command with options
        cmd = ["lp", "-d", PRINTER_NAME, "-n", copies]
        
        # Orientation
        if orientation.lower() == 'landscape':
            cmd.extend(["-o", "landscape"])
        
        # Color model - specific to the Epson driver
        if color:
            cmd.extend(["-o", "Ink=COLOR"])
        else:
            cmd.extend(["-o", "Ink=MONO"])

        # Media size
        cmd.extend(["-o", f"media={media}"])

        # Add file path at the end
        cmd.append(file_path)

        app.logger.info("Executing CUPS command: %s", " ".join(map(str, cmd)))
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            app.logger.error("Printing failed: %s", result.stderr.strip())
            # Return a consistent error structure
            return jsonify(
                status="ERROR",
                details=result.stderr.strip(),
                cupsJobId=""
            ), 500

        # Extract the CUPS job ID from the successful output
        # Example output: "request id is EPSON_L3210_Series-15 (1 file(s))"
        job_id = ""
        output_str = result.stdout.strip()
        if "request id is" in output_str:
            try:
                # Split by space and get the part after "is"
                job_id = output_str.split(" is ")[1].split(" ")[0]
            except IndexError:
                app.logger.warning("Could not parse job ID from output: %s", output_str)
        
        return jsonify(
            status="Print job processed",
            details=output_str,
            cupsJobId=job_id
        ), 200

    except Exception as e:
        app.logger.exception("Unhandled exception in /print")
        return jsonify(
            status="ERROR",
            details=str(e),
            cupsJobId=""
        ), 500

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.route('/status', methods=['GET'])
def status():
    """
    Returns current printer status as JSON.
    """
    return jsonify(get_printer_status()), 200

@app.route('/job_status/<job_id>', methods=['GET'])
def job_status(job_id):
    """
    Check the status of a specific CUPS job.
    """
    try:
        # lpstat -o shows pending/printing jobs
        cmd = ["lpstat", "-o"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return jsonify(error="Failed to get job statuses", details=result.stderr), 500

        job_found = False
        is_active = False
        output_lines = result.stdout.strip().split('\n')
        
        for line in output_lines:
            if line.strip().startswith(job_id):
                job_found = True
                # If the job is in the output of `lpstat -o`, it's active (pending or printing)
                is_active = True
                break
        
        if not job_found:
            # If not in active jobs, it might be completed or have failed.
            # We'll assume "COMPLETED" if not found, as CUPS history is harder to parse reliably.
            return jsonify(jobId=job_id, status="COMPLETED", message="Job is no longer in the active queue."), 200
        else:
            return jsonify(jobId=job_id, status="PRINTING", message="Job is currently in the active queue."), 200

    except Exception as e:
        app.logger.exception("Error checking job status for %s", job_id)
        return jsonify(error="Internal server error", details=str(e)), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
