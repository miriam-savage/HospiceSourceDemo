import { IPatient } from "./patient.model";
import { ILine } from "./line.model";

export interface IOrder {
    id?: string;
    patient: IPatient;
    type: string;
    lines?: ILine[];
}

export interface IOrderDocument {
    patientId: string;
    type: string;
    id?: string;
}