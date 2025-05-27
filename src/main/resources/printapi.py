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
        else:
            status_output = status_result.stdout.strip()
            if "disabled" in status_output.lower():
                status = "OFFLINE"
            elif "idle" in status_output.lower():
                status = "ONLINE"
            elif "printing" in status_output.lower():
                status = "ONLINE"  # Consider as online but busy
            else:
                status = "MAINTENANCE"  # Default when status is unclear
            message = status_output
        
        # Get ink levels if possible (this is printer-specific and may require additional tools)
        try:
            ink_cmd = ["ink", "-p", PRINTER_NAME]  # This command is theoretical and depends on your system
            ink_result = subprocess.run(ink_cmd, capture_output=True, text=True, timeout=2)
            ink_levels = ink_result.stdout.strip() if ink_result.returncode == 0 else "Unknown"
        except (subprocess.SubprocessError, FileNotFoundError):
            ink_levels = "Not available"
        
        return {
            "status": status,
            "message": message,
            "queueLength": queue_length,
            "inkLevels": ink_levels,
            "timestamp": datetime.datetime.now().isoformat()
        }
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
    Accepts raw PDF bytes in the POST body, writes to JOB_DIR, sends to CUPS,
    and returns both print outcome and current printer status.
    """
    file_data = request.get_data()
    filename = f"{os.urandom(8).hex()}.pdf"
    file_path = os.path.join(JOB_DIR, filename)

    try:
        # Save PDF
        with open(file_path, 'wb') as f:
            f.write(file_data)

        # Send to specific printer
        cmd = ["lp", "-d", PRINTER_NAME, file_path]
        result = subprocess.run(cmd, capture_output=True, text=True)

        # Check for print errors
        if result.returncode != 0:
            app.logger.error("Printing failed: %s", result.stderr.strip())
            return jsonify(
                error="Printing failed",
                details=result.stderr.strip(),
                printer_status=get_printer_status()
            ), 500

        # Success
        return jsonify(
            status="Print job processed",
            printer_status=get_printer_status()
        ), 200

    except Exception as e:
        app.logger.exception("Unhandled exception in /print")
        return jsonify(
            error="Internal server error",
            details=str(e),
            printer_status=get_printer_status()
        ), 500

    finally:
        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)

@app.route('/status', methods=['GET'])
def status():
    """
    Returns current printer status as JSON.
    """
    return jsonify(get_printer_status()), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
