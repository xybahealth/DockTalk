const mongooose = require('mongoose');
const reportSchema = new mongooose.Schema(
  {
    patient_bed_no: { type: String, required: true },
    report_title: {
      type: String,
      required: true,
    },
    uploaded_by: {
      type: String,
    },
    uploaded_at: {
      type: String,
    },
    lab_report: {},
  },
  {
    timestamps: true,
  }
);

const reportModel = mongooose.model('lab_reports', reportSchema);
module.exports = reportModel;
