import * as admin from 'firebase-admin';

import { IPatient } from './models/patient.model';
import { Utils } from './common/utils';

export class PatientService {
    private db: any = null;
    private mydb = admin.firestore();

    constructor(db: any) {
        this.db = db;
    }

    static sanitizePatient(json: any): IPatient {
        const patient: IPatient = {
            name: json.name,
            address: json.address,
            city: json.city,
            state: json.state,
            zip: json.zip
        };

        if (json.hasOwnProperty('id')) patient.id = json.id;
        if (json.hasOwnProperty('address2')) patient.id = json.address2;
        if (json.hasOwnProperty('key')) patient.key = json.key;

        return patient;
    }

    static validPatient(patient: IPatient) {
        if(Utils.isEmpty(patient)) return false;
        if(Utils.isEmpty(patient.name)) return false;
        if(Utils.isEmpty(patient.address)) return false;
        if(Utils.isEmpty(patient.city)) return false;
        if(Utils.isEmpty(patient.state)) return false;
        if(Utils.isEmpty(patient.zip)) return false;
        return true;
    }

    static getPatientKey(name: string): string {
        //create name key
        return name.replace(/\s/g,'').toLowerCase();

    }

    async addPatient(json: any) {
        const patient = PatientService.sanitizePatient(json);

        if (!PatientService.validPatient(patient)) {
            return { isValid: false, message: 'Missing patient data', httpStatus: 400 };
        }

        //create name key
        patient.key = PatientService.getPatientKey(patient.name);

        //check to see if key exists
        // If exists, return error
        //Use name key to find matching patients
        const patientsRef = this.mydb.collection('Patients');
        const keycheckResults = await patientsRef.where('key', '==', patient.key).get()
        .then(snapshot => {
            if(!snapshot.empty) {
                return { isValid: false, message: 'Patient with that name exists', httpStatus: 400 };
            }
            return { isValid: true, message: 'Valid patient name', httpStatus: 200 };
        })
        .catch(err => {
            console.error('Error getting patient ' + patient.key + ': ' + err);
            return { isValid: false, message: 'ERROR getting patient', httpStatus: 500 };
        });
        if (!keycheckResults.isValid) return keycheckResults;

        // Add patient
        const results = await this.db.collection('Patients').add(patient)
        .then(ref => {
            patient.id = ref.id;
            console.log('Added patient with ID: ', JSON.stringify(patient));
            return { isValid: true, message: patient, httpStatus: 200 }; 
        })
        .catch(err => {
            console.error('Error adding patient: ' + err);
            return { isValid: false, message: 'ERROR adding patient', httpStatus: 500 };
        });

        return results;
    }

    async getPatientByName(name: string) {
        if(Utils.isEmpty(name)) {
            return { isValid: false, message: 'Missing search parameter', httpStatus: 400 };
        }

        const key = PatientService.getPatientKey(name);

        //Use name key to find matching patients
        const patientsRef = this.db.collection('Patients');
        const results = await patientsRef.where('key', '==', key).get()
        .then(snapshot => {
            const foundPatients: IPatient[] = new Array();
            snapshot.forEach(doc => {
                console.log(doc.id, '=>', doc.data());
                foundPatients.push(PatientService.sanitizePatient(doc.data()));
            });
            return { isValid: true, message: foundPatients, httpStatus: 200 };
        })
        .catch(err => {
            console.error('Error getting patient "' + key + '": ' + err);
            return { isValid: false, message: 'ERROR getting patient', httpStatus: 500 };
        });

        return results;
    }

}