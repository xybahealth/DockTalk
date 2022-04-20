const mongooose = require('mongoose');
const patientSchema = new mongooose.Schema(
  {
    bedNo: {
      type: String,
      required: true,
    },
    wardName: { type: String },
    ipNumber: { type: String, unique: true, sparse: true },
    patient_details: {},
    associated_room: {
      type: String,
    },
    sypnosis: [],
    assessment: [],
    patientIssueAndComplain: [],
    patientPlan: [],
    hematology: [],
    urine: [],
    bioChemistry: [],
    heightWeightBmi: [],
    mentalStatus: [],
    generalExamination: [],
    recentUpdates: [],
    otherDiseaseGeneralExamination: [],
    systematicLocalExamValue: [],
    vitals: [],
    operationPerformedModels: [],
    otherInvestigation: [],
    knownMedicalHistory: { type: String },
    menstrualHistory: { type: String },
    obstetricHistory: { type: String },
    otherRelevantHistory: { type: String },
    presentingComplain: { type: String },
    observation: { type: String },
    plan: { type: String },
    previous_vitals: {},
    patient_history: [],
    favourites: [],
    isArchived: { type: Boolean }, //If Archived is true do not show this patient to user
    created_by: { type: String },
    last_updated_time: { type: String },
    last_updated_by: { type: String },
    hopi:{type:String},
    pastHistory:{type:String},
    familyHistory:{type:String},
    socioEconomicHistory:{type:String}
  },
  {
    timestamps: true,
  }
);

const patientModel = mongooose.model('patients', patientSchema);
module.exports = patientModel;
