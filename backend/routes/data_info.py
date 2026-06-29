from flask import Blueprint, jsonify
from models import Patient
from models.model_metadata import ModelMetadata
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

data_info_bp = Blueprint("data_info", __name__)

@data_info_bp.route('/api/data/overview', methods=['GET'])
def get_data_overview():
    """Get overview of the data in MongoDB."""
    try:
        # Get total number of patients
        try:
            total_patients = Patient.objects.count()
            print(f"Total patients in database: {total_patients}")
        except Exception as e:
            print(f"Error counting patients: {str(e)}")
            total_patients = 0
        
        # Debug: Print first few patients if they exist
        if total_patients > 0:
            try:
                first_patient = Patient.objects.first()
                print(f"First patient data: {first_patient.to_json()}")
            except Exception as e:
                print(f"Error getting first patient: {str(e)}")
        else:
            print("No patients found in database")
        
        # Get model versions
        try:
            model_versions = ModelMetadata.objects.only('version', 'selected_features').order_by('-version')
            print(f"Number of model versions: {model_versions.count()}")
        except Exception as e:
            print(f"Error getting model versions: {str(e)}")
            model_versions = []
        
        # Format model versions
        versions = [{
            'version': model.version,
            'feature_count': len(model.selected_features) if model.selected_features else 0,
            'features': model.selected_features if model.selected_features else []
        } for model in model_versions]
        
        # Get basic statistics for numerical fields
        numerical_stats = {}
        numerical_fields = ['age', 'Body_Mass_Index', 'Mrs_admission', 'NIHSS_admission']
        
        for field in numerical_fields:
            try:
                # Get all non-null values for the field
                values = Patient.objects(**{field + '__ne': None}).only(field)
                if values:
                    min_val = min(getattr(p, field) for p in values)
                    max_val = max(getattr(p, field) for p in values)
                    count = values.count()
                else:
                    min_val = None
                    max_val = None
                    count = 0
                
                numerical_stats[field] = {
                    'min': min_val,
                    'max': max_val,
                    'count': count
                }
                print(f"Stats for {field}: {numerical_stats[field]}")
            except Exception as e:
                print(f"Warning: Could not get stats for {field}: {str(e)}")
                numerical_stats[field] = {'min': None, 'max': None, 'count': 0}
        
        # Get categorical field counts
        categorical_stats = {}
        categorical_fields = ['Gender', 'medical_insurance', 'payment_method']
        
        for field in categorical_fields:
            try:
                # Get all non-null values for the field
                values = Patient.objects(**{field + '__ne': None}).only(field)
                if values:
                    # Count occurrences of each value
                    value_counts = {}
                    for patient in values:
                        val = getattr(patient, field)
                        value_counts[val] = value_counts.get(val, 0) + 1
                    count = values.count()
                else:
                    value_counts = {}
                    count = 0
                
                categorical_stats[field] = {
                    'values': value_counts,
                    'count': count
                }
                print(f"Stats for {field}: {categorical_stats[field]}")
            except Exception as e:
                print(f"Warning: Could not get stats for {field}: {str(e)}")
                categorical_stats[field] = {'values': {}, 'count': 0}
        
        return jsonify({
            'total_patients': total_patients,
            'model_versions': versions,
            'numerical_stats': numerical_stats,
            'categorical_stats': categorical_stats,
            'last_updated': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"Error in get_data_overview: {str(e)}")
        return jsonify({"error": str(e)}), 500

@data_info_bp.route('/api/data/features', methods=['GET'])
def get_feature_info():
    """Get detailed information about features."""
    try:
        # Get all unique features across all model versions
        all_features = set()
        for model in ModelMetadata.objects:
            if model.selected_features:
                all_features.update(model.selected_features)
        
        # Get feature descriptions and validation rules
        feature_info = {
            'Body_Mass_Index': {
                'description': 'Body Mass Index',
                'type': 'numerical',
                'validation': {'min': 15, 'max': 40},
                'unit': 'kg/m²'
            },
            'age': {
                'description': 'Patient Age',
                'type': 'numerical',
                'validation': {'min': 18, 'max': 100},
                'unit': 'years'
            },
            'Mrs_admission': {
                'description': 'Modified Rankin Scale at Admission',
                'type': 'numerical',
                'validation': {'min': 0, 'max': 5},
                'unit': 'score'
            },
            'NIHSS_admission': {
                'description': 'NIH Stroke Scale at Admission',
                'type': 'numerical',
                'validation': {'min': 0, 'max': 42},
                'unit': 'score'
            },
            'Gender': {
                'description': 'Patient Gender',
                'type': 'categorical',
                'values': ['Male', 'Female']
            },
            'medical_insurance': {
                'description': 'Medical Insurance Type',
                'type': 'categorical'
            },
            'payment_method': {
                'description': 'Payment Method',
                'type': 'categorical'
            }
        }
        
        # Filter feature info to only include features that exist in the data
        existing_features = {k: v for k, v in feature_info.items() if k in all_features}
        
        return jsonify({
            'features': existing_features,
            'total_features': len(existing_features)
        })
        
    except Exception as e:
        print(f"Error in get_feature_info: {str(e)}")  # Debug print
        return jsonify({"error": str(e)}), 500

@data_info_bp.route('/api/data/models', methods=['GET'])
def get_model_info():
    """Get detailed information about available models."""
    try:
        models = ModelMetadata.objects.order_by('-version')
        
        model_info = []
        for model in models:
            info = {
                'version': model.version,
                'selected_features': model.selected_features if model.selected_features else [],
            }
            
            # Add optional fields if they exist
            if hasattr(model, 'performance_metrics'):
                info['performance_metrics'] = model.performance_metrics
            if hasattr(model, 'description'):
                info['description'] = model.description
            if hasattr(model, 'feature_importance'):
                info['feature_importance'] = model.feature_importance
                
            model_info.append(info)
        
        return jsonify({
            'models': model_info,
            'total_models': len(model_info)
        })
        
    except Exception as e:
        print(f"Error in get_model_info: {str(e)}")  # Debug print
        return jsonify({"error": str(e)}), 500 