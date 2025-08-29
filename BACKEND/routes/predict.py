from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
# Import the prediction function from our new helper file
from model_loader import make_prediction

# Create a Blueprint for prediction routes
predict_bp = Blueprint('predict_bp', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    """Checks if the file's extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@predict_bp.route('/upload', methods=['POST'])
def upload_file():
    """Handles MRI scan file upload and returns a model prediction."""
    if 'mriScan' not in request.files:
        return jsonify({'msg': 'No file part in the request'}), 400
    
    file = request.files['mriScan']

    if file.filename == '':
        return jsonify({'msg': 'No file selected'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        
        # Read the image file into bytes
        image_bytes = file.read()
        
        # Get prediction from our model
        prediction, probability = make_prediction(image_bytes)
        
        if prediction is not None:
            result_text = "Tumor Detected" if prediction == 1 else "No Tumor Detected"
            
            return jsonify({
                'fileName': filename,
                'prediction': {
                    'result': result_text,
                    'confidence': f"{probability:.2%}" # Format as percentage
                }
            }), 200
        else:
            return jsonify({'msg': 'Error processing the image'}), 500
    else:
        return jsonify({'msg': 'File type not allowed'}), 400
