from flask import Flask, request, jsonify
import subprocess
import os
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Directory for incoming jobs and printer name\NJOB_DIR = "/home/pi/print_jobs"
PRINTER_NAME = "EPSON_L3210_Series"
# Ensure job directory exists
os.makedirs(JOB_DIR, exist_ok=True)

def get_printer_status():
    """
    Run lpstat to fetch the printer's status.
    Returns a dict with 'status' or 'error'.
    """
    cmd = ["lpstat", "-p", PRINTER_NAME]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return {"error": result.stderr.strip()}
    return {"status": result.stdout.strip()}

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
