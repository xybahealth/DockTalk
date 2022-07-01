const { json } = require('express');
var express = require('express');
var multer = require('multer');
var path = require('path');
const multerSettings = require('../configs/multerSetup');
const auth = require('../middlewares/auth');

var router = express.Router();
var patientModel = require('../models/patients');

require('dotenv').config();

// Multer Storage Setup
var upload = multer({
  storage: multerSettings.patientFiles.myStorage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (
      ext !== '.png' &&
      ext !== '.jpg' &&
      ext !== '.gif' &&
      ext !== '.jpeg' &&
      ext !== '.pdf' &&
      ext !== '.docx'
    ) {
      return callback(new Error('Only images and pdf are allowed'));
    }
    callback(null, true);
  },
});

//Returns Non-Archived Patients related to room
router.get('/patients/:room_id', auth, function (req, res, next) {
  patientModel
    .find({ associated_room: req.params.room_id, isArchived: false })
    .exec((err, result) => {
      if (err) return res.json({ msg: 'Server Error' });
      else {
        var data = result;
        //Sorting according to latest timestamp value

        data.sort(function (x, y) {
          return y.last_updated_time - x.last_updated_time;
        });

        res.json({
          msg: ' Non-Archived patients Related to Room Fetched',
          data: data,
        });
      }
    });
});

//Returns Archived Patients related to room
router.get('/archived/:room_id', auth, function (req, res, next) {
  patientModel
    .find({ associated_room: req.params.room_id, isArchived: true })
    .exec((err, result) => {
      if (err) return res.json({ msg: 'Server Error' });
      else {
        var data = result;
        //Sorting according to latest timestamp value

        data.sort(function (x, y) {
          return y.last_updated_time - x.last_updated_time;
        });

        res.json({
          msg: ' Archived patients related to Room Fetched',
          data: data,
        });
      }
    });
});

//Get Patient by id
router.get('/patient/:id', auth, function (req, res, next) {
  patientModel.findById({ _id: req.params.id }).exec((err, patient) => {
    if (err) return res.json({ msg: 'Server Error', error: err });
    if (!patient) return res.json({ msg: 'No Patient Found' });
    else {
      res.json({
        msg: 'Patient fetched',
        data: patient,
      });
    }
  });
});

//Create Patient
router.post('/create', auth, function (req, res, next) {
  patientModel.findOne({ ipNumber: req.body.ipNumber }).exec((err, patient) => {
    if (err) return res.json({ msg: 'Server Error', err: err });
    if (patient) return res.json({ msg: 'Patient already Exists' });
    else {
      //creating new Patient
      //update by me .. added 4field hopi,patientHistory,familyHistory,sociEconominHistory,
      var newPatient = new patientModel({
        ipNumber: req.body.ipNumber,
        wardName: req.body.wardName,
        bedNo: req.body.bedNo,
        associated_room: req.body.associated_room,
        created_by: req.body.created_by,
        presentingComplain: req.body.presentingComplain,
        knownMedicalHistory: req.body.knownMedicalHistory,
        menstrualHistory: req.body.menstrualHistory,
        obstetricHistory: req.body.obstetricHistory,
        otherRelevantHistory: req.body.otherRelevantHistory,
        operationPerformedModels: req.body.operationPerformedModels,
        hopi:req.body.hopi,
        pastHistory:req.body.pastHistory,
        familyHistory:req.body.familyHistory,
        socioEconomicHistory:req.body.socioEconomicHistory,

        isArchived: false,
      });

      //Patient Details Object
      var patientDetails = {
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
        age: req.body.age,
        gender: req.body.gender,
        temporaryAddress: req.body.temporaryAddress,
        permanentAddress: req.body.permanentAddress,
        occupation: req.body.occupation,
        contactNumber: req.body.contactNumber,
        admittedDate: req.body.admittedDate,
        admittedDepartment: req.body.admittedDepartment,
        admittedUnit: req.body.admittedUnit,
      };
      newPatient.patient_details = patientDetails;

      //saving the patient
      newPatient.save(function (error, data) {
        if (error)
          return res.json({
            msg: 'Server Error ',
            error: error,
          });
        else {
          res.json({
            msg: 'Patient Created ',
            data: data,
          });
        }
      });
    }
  });
});

//Add other Investigation to array inside patient
router.put(
  '/patient/update/investigation/:id',
  auth,
  upload.single('img'),
  function (req, res, next) {
    const { title, remark, last_updated_by, addedBy } = req.body;

    if (req.file) {
	    console.log(req.file);
      var secure_url = process.env.API_ORIGIN + req.file.path;

      var update = {
        title: title,
        remark: remark,
        img: secure_url,
        addedBy: addedBy,
        addedAt: Date.now(),
      };

      patientModel.update(
        { _id: req.params.id },
        {
          $push: {
            otherInvestigation: update,
            recentUpdates: {
              type: 'otherInvestigation',
              data: update,
            },
          },
          $set: {
            last_updated_time: Date.now(),
            last_updated_by: last_updated_by,
          },
        },
        { new: true },
        function (err, done) {
          if (err)
            return res.json({
              msg: 'Server Error',
              error: err,
            });
          else {
            return res.status(200).json({
              msg: 'Other Investigation Added',
		report: done    
            });
          }
        }
      );
    } else {
      var update = {
        title: title,
        remark: remark,
        addedBy: addedBy,
        addedAt: Date.now(),
      };

      patientModel.update(
        { _id: req.params.id },
        {
          $push: {
            otherInvestigation: update,
            recentUpdates: {
              type: 'otherInvestigation',
              data: update,
            },
          },
          $set: {
            last_updated_time: Date.now(),
            last_updated_by: last_updated_by,
          },
        },
        { new: true },
        function (err, done) {
          if (err)
            return res.status(500).json({
              msg: 'Server Error',
              error: err,
            });
          else {
            return res.status(200).json({
              msg: 'Other Investigation Added',
            });
          }
        }
      );
    }
  }
);

//Update Patient Plan and Assement
router.put('/patient/update/assessment/:id', function (req, res, next) {
  const { assessment, patientPlan, last_updated_by } = req.body;

  patientModel.update(
    { _id: req.params.id },
    {
      $push: {
        assessment: assessment,
        patientPlan: patientPlan,
        recentUpdates: {
          type: 'Assessment',
          data: assessment,
        },
        recentUpdates: {
          type: 'patientPlan',
          data: patientPlan,
        },
      },
      $set: {
        last_updated_time: Date.now(),
        last_updated_by: last_updated_by,
      },
    },
    { new: true },
    function (err, done) {
      if (err)
        return res.status(500).json({
          msg: 'Server Error',
          error: err,
        });
      else {
        return res.status(200).json({
          msg: 'Assessment and Patient Plan Added',
        });
      }
    }
  );
});

//Update patient Vital by id

router.put('/patient/update/vital/:id', auth, function (req, res, next) {
  const { vitals, last_updated_by } = req.body;
  //pushing vital array into db
  patientModel.update(
    { _id: req.params.id },
    {
      $push: {
        vitals: vitals,
        recentUpdates: {
          type: 'vitals',
          data: vitals,
        },
      },
    },
    function (err, done) {
      if (err)
        return res.json({
          msg: 'Server Error',
          error: err,
        });
      else {
        //adding other details
        patientModel
          .findByIdAndUpdate(
            { _id: req.params.id },
            { last_updated_by: last_updated_by, last_updated_time: Date.now() }
          )
          .exec((error, msg) => {
            if (error) return res.json({ msg: 'Server error' });
            if (msg) {
              res.status(200).json({
                msg: 'Vital Added',
              });
            }
          });
      }
    }
  );
});

//Editing Patient Basic Details like bedNo , WardNo, isArchived, patient_details,operationPerformedModels
router.put('/patient/update/basic/:id', auth, function (req, res, next) {
  const {
    bedNo,
    wardName,
    isArchived,
    patient_details,
    operationPerformedModels,
    last_updated_by,
    last_updated_time,
  } = req.body;

  //Editing basic info

  patientModel.findByIdAndUpdate({ _id: req.params.id }, req.body, function (
    err,
    done
  ) {
    if (err)
      return res.status(400).json({
        msg: 'Server Error',
        error: err,
      });
    else {
      res.json({
        msg: 'Fields Updated',
      });
    }
  });
});

//Updating Synopsis
router.put('/patient/update/synopsis/:id', auth, function (req, res, next) {
  const { synopsis } = req.body;
  
  patientModel.update(
    { _id: req.params.id },
    { $push: { synopsis : synopsis } },
    function (err, done) {
      if (err)
        return res.json({
          isSuccess: false,
          msg: 'Server Error',
        });
      else {
        res.json({
          isSuccess: true,
          msg: 'Synopsis Added !',
        });
      }
    }
  );
});

//Update patient General Examination and more like Mental Stauts ,diseases examination,
router.put('/patient/update/examination/:id', auth, function (req, res, next) {
  const {
    mentalStatus,
    heightWeightBmi,
    generalExamination,
    otherDiseaseGeneralExamination,
    systematicLocalExamValue,
    last_updated_by,
  } = req.body;

  //Pushing Examination into Patient
  patientModel.update(
    { _id: req.params.id },
    {
      $push: {
        mentalStatus: mentalStatus,
        heightWeightBmi: heightWeightBmi,
        otherDiseaseGeneralExamination: otherDiseaseGeneralExamination,
        systematicLocalExamValue: systematicLocalExamValue,
        recentUpdates: {
          type: 'generalExaminations',
          data: {
            mentalStatus: mentalStatus,
            heightWeightBmi: heightWeightBmi,
            generalExamination: generalExamination,
            otherDiseaseGeneralExamination: otherDiseaseGeneralExamination,
            systematicLocalExamValue: systematicLocalExamValue,
          },
        },
      },
      $set: {
        last_updated_by: last_updated_by,
        last_updated_time: Date.now(),
      },
    },
    { new: true },
    function (err, done) {
      if (err) return res.status(500).json({ msg: 'Server Error', error: err });
      else {
        if (generalExamination) {
          // Adding General Examination
          patientModel
            .findByIdAndUpdate(
              { _id: req.params.id },
              { generalExamination: generalExamination }
            )
            .exec((error, success) => {
              if (error)
                return res
                  .status(500)
                  .json({ msg: 'Server Error', error: error });
              else {
                res.status(200).json({
                  msg: 'Fields Updated',
                });
              }
            });
        } else {
          res.status(200).json({
            msg: 'Fields Updated',
          });
        }
      }
    }
  );
});

//Update patient BioChemistry,urine,hematology
router.put('/patient/update/biochemisty/:id', auth, function (req, res, next) {
  const { hematology, urine, bioChemistry, last_updated_by } = req.body;

  //Updating Fields
  patientModel.update(
    { _id: req.params.id },
    {
      $push: {
        hematology: hematology,
        urine: urine,
        bioChemistry: bioChemistry,
        recentUpdates: {
          type: 'urine_hematology_biochemistry',
          data: {
            hematology: hematology,
            urine: urine,
            bioChemistry: bioChemistry,
          },
        },
      },
      $set: {
        last_updated_by: last_updated_by,
        last_updated_time: Date.now(),
      },
    },
    { new: true },
    function (err, done) {
      if (err)
        return res.status(400).json({
          msg: 'Server Error',
          error: err,
        });
      else {
        res.status(204).json({
          msg: 'Fields Updated ',
        });
      }
    }
  );
});

//Update recent updates of patient
router.put('/patient/update/updates/:id', auth, function (req, res, next) {
  const { recentUpdate } = req.body;

  //Updating Fields
  patientModel.update(
    { _id: req.params.id },
    {
      $push: {
        recentUpdates: recentUpdate,
      },
    },
    { new: true },
    function (err, done) {
      if (err)
        return res.status(400).json({
          msg: 'Server Error',
          error: err,
        });
      else {
        res.status(204).json({
          msg: 'Recent Update Added  ',
        });
      }
    }
  );
});

//Update patient specific  General Examination and more like Mental Stauts ,diseases examination,
//update new data will be added to this update system... hopi,pastHistory,familyHistory,sociEconomicHistory
router.put('/patient/update/specific/examination/:id', auth, function (
  req,
  res,
  next
) {
  const {
    mentalStatus,
    heightWeightBmi,
    generalExamination,
    otherDiseaseGeneralExamination,
    systematicLocalExamValue,
    hematology,
    urine,
    bioChemistry,
    assessment,
    patientPlan,
    patientIssueAndComplain,
    last_updated_by,
    prescription

  } = req.body;

  if (mentalStatus) {
    //Push Mental Status into mentalStatus Array
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          mentalStatus: mentalStatus,
          recentUpdates: {
            type: 'mentalStatus',
            data: mentalStatus,
          },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },
      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'Mental Status Added',
          });
        }
      }
    );
  }else if(prescription){
    //ashishdhakal added this line new field new line
    patientModel
    .update(
      { _id: req.params.id },
      {
        $push: {
          prescription: prescription,
          recentUpdates: {
            type: 'prescription',
            data: prescription,
          },
        },
        $set: {
          last_updated_by: last_updated_by,
          last_updated_time: Date.now(),
        },
      },
      { new: true }
    )
    .exec((err, done) => {
      if (err)
        return res.status(500).json({
          msg: 'Server Error',
          error: err,
        });
      else {
        res.status(200).json({
          msg: 'Prescrpiton Added',
        });
      }
    });
    
}else if (heightWeightBmi) {
    //Push height weight bmi into heightWeightBmi array
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          heightWeightBmi: heightWeightBmi,
          recentUpdates: {
            type: 'heightWeightBmi',
            data: heightWeightBmi,
          },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },
      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'Height Weight BMI Added',
          });
        }
      }
    );
  } else if (generalExamination) {
    //update general Examination
    patientModel
      .update(
        { _id: req.params.id },
        {
          $push: {
            generalExamination: generalExamination,
            recentUpdates: {
              type: 'generalExamination',
              data: generalExamination,
            },
          },
          $set: {
            last_updated_by: last_updated_by,
            last_updated_time: Date.now(),
          },
        },
        { new: true }
      )
      .exec((err, done) => {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'General Examination Added',
          });
        }
      });
  } else if (otherDiseaseGeneralExamination) {
    //Push otherDiseaseGeneralExamination
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          otherDiseaseGeneralExamination: otherDiseaseGeneralExamination,
          recentUpdates: {
            type: 'otherDiseaseGeneralExamination',
            data: otherDiseaseGeneralExamination,
          },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },

      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'otherDiseaseGeneralExamination Added',
          });
        }
      }
    );
  } else if (systematicLocalExamValue) {
    //Push otherDiseaseGeneralExamination
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          systematicLocalExamValue: systematicLocalExamValue,
          recentUpdates: {
            type: 'systematicLocalExamValue',
            data: systematicLocalExamValue,
          },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },
      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'systematicLocalExamValue Added',
          });
        }
      }
    );
  } else if (hematology) {
    //Push height weight bmi into heightWeightBmi array
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          hematology: hematology,
          recentUpdates: {
            type: 'hematology',
            data: hematology,
          },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },
      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'Hematology Added',
          });
        }
      }
    );
  } else if (urine) {
    //Push height weight bmi into heightWeightBmi array
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          urine: urine,
          recentUpdates: { type: 'urine', data: urine },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },
      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'Urine Details Added',
          });
        }
      }
    );
  } else if (bioChemistry) {
    //Push height weight bmi into heightWeightBmi array
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          bioChemistry: bioChemistry,
          recentUpdates: {
            type: 'bioChemistry',
            data: bioChemistry,
          },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },
      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'Bio Chemistry Added',
          });
        }
      }
    );
  } else if (assessment) {
    //Push assessment into  array
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          assessment: assessment,
          recentUpdates: {
            type: 'assessment',
            data: assessment,
          },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },
      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'Assessment Added',
          });
        }
      }
    );
  } else if (patientPlan) {
    //Push patientPlan to array
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          patientPlan: patientPlan,
          recentUpdates: {
            type: 'patientPlan',
            data: patientPlan,
          },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },
      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'Patient Plan Added',
          });
        }
      }
    );
  } else if (patientIssueAndComplain) {
    //Push patient Issue and COmplain to array
    patientModel.update(
      { _id: req.params.id },
      {
        $push: {
          patientIssueAndComplain: patientIssueAndComplain,
          recentUpdates: {
            type: 'patientIssueAndComplain',
            data: patientIssueAndComplain,
          },
        },
        $set: {
          last_updated_time: Date.now(),
          last_updated_by: last_updated_by,
        },
      },
      { new: true },
      function (err, done) {
        if (err)
          return res.status(500).json({
            msg: 'Server Error',
            error: err,
          });
        else {
          res.status(200).json({
            msg: 'PatientIssue and Complain Added',
          });
        }
      }
    );
  } else {
    return res.status(400).json({
      msg: 'Data must be provided to update',
    });
  }
});


//ghanashyam added new api for prescrption value update using index
router.put('/patient/update/update/prescrption/:id', auth,function (req, res) {
  //here we get id from params and index from query
  
 const {last_updated_by,prescription}=req.body;
 const index=req.query.index;
patientModel.findById({_id:req.params.id}).exec((error,result)=>{
  let stringData=result.prescription;
  console.log(JSON.parse(stringData[0]));
  res.status(200).json({"msg":"Data Fetched","data":result});
})



 /*
patientModel
.update(
  { _id: req.params.id },
  {
    [`prescription.${index}`]: prescription,
    $set: {
      last_updated_by: last_updated_by,
      last_updated_time: Date.now(),
    },
  },
  { new: true }
)
.exec((err, done) => {
  if (err)
    return res.status(500).json({
      msg: 'Server Error',
      error: err,
    });
  else {
    res.status(200).json({
      msg: 'Prescrpiton value updated for given index',
    });
  }
});*/

});


module.exports = router;
