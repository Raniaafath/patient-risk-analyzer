from flask_mongoengine import MongoEngine

db = MongoEngine()

class Patient(db.Document):
    """Patient data model for MongoDB."""
    meta = {
        'collection': 'MOESM1_ESM'  # Only change the collection name
    }
    
    medical_insurance = db.IntField()
    payment_method = db.IntField()
    Body_Mass_Index = db.FloatField()
    hypertension = db.IntField()
    coronary_heart_disease = db.IntField()
    diabetes = db.IntField()
    transient_ischemic_attack = db.IntField()
    peripheral_arterial_disease = db.IntField()
    Postoperative_sequelae = db.IntField()
    atrial_fibrillation = db.IntField()
    hyperlipidemia = db.IntField()
    hyperhomocysteinemia = db.IntField()
    epilepsy = db.IntField()
    respiratory_tract_infection = db.IntField()
    dizziness = db.IntField()
    trauma = db.IntField()
    hemiplegia = db.IntField()
    aphasia = db.IntField()
    cognitive_disorder = db.IntField()
    Mrs_admission = db.IntField()
    NIHSS_admission = db.IntField()
    Gender = db.IntField()
    age = db.IntField()
    marital_status = db.IntField()
    occupation = db.IntField()
    critical = db.IntField()
    operation = db.IntField()
    LOS = db.IntField()  # Target variable