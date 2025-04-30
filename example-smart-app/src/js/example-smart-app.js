(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

 /*  function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');

          var p = defaultPatient();
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }*/
    function onReady(smart) {
  if (smart.hasOwnProperty('patient')) {
    var patient = smart.patient;
    var pt = patient.read();

    var obv = smart.patient.api.fetchAll({
      type: 'Observation',
      query: {
        code: {
          $or: [
            'http://loinc.org|8302-2',
            'http://loinc.org|8462-4',
            'http://loinc.org|8480-6',
            'http://loinc.org|2085-9',
            'http://loinc.org|2089-1',
            'http://loinc.org|55284-4'
          ]
        }
      }
    });

    // Safe fetches with error catching
    var allergies = smart.patient.api.fetchAll({ type: 'AllergyIntolerance' }).catch(e => {
      console.error("Error fetching allergies:", e);
      return [];
    });

    var conditions = smart.patient.api.fetchAll({ type: 'Condition' }).catch(e => {
      console.error("Error fetching conditions:", e);
      return [];
    });

    var medications = smart.patient.api.fetchAll({ type: 'MedicationRequest' }).catch(e => {
      console.error("Error fetching medications:", e);
      return [];
    });

    var immunizations = smart.patient.api.fetchAll({ type: 'Immunization' }).catch(e => {
      console.error("Error fetching immunizations:", e);
      return [];
    });

    $.when(pt, obv, allergies, conditions, medications, immunizations).fail(onError);

    $.when(pt, obv, allergies, conditions, medications, immunizations).done(function (
      patient,
      obv,
      allergies,
      conditions,
      medications,
      immunizations
    ) {
      try {
        var byCodes = smart.byCodes(obv, 'code');
        var gender = patient.gender;

        var fname = '';
        var lname = '';

        if (typeof patient.name[0] !== 'undefined') {
          fname = patient.name[0].given.join(' ');
          lname = patient.name[0].family.join(' ');
        }

        var height = byCodes('8302-2');
        var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
        var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
        var hdl = byCodes('2085-9');
        var ldl = byCodes('2089-1');

        var p = defaultPatient();
        p.birthdate = patient.birthDate;
        p.gender = gender;
        p.fname = fname;
        p.lname = lname;
        p.height = getQuantityValueAndUnit(height[0]);

        if (typeof systolicbp !== 'undefined') {
          p.systolicbp = systolicbp;
        }

        if (typeof diastolicbp !== 'undefined') {
          p.diastolicbp = diastolicbp;
        }

        p.hdl = getQuantityValueAndUnit(hdl[0]);
        p.ldl = getQuantityValueAndUnit(ldl[0]);

        // Log to console (if available)
        if (allergies.length) console.log("Allergies:", allergies);
        if (conditions.length) console.log("Conditions:", conditions);
        if (medications.length) console.log("Medications:", medications);
        if (immunizations.length) console.log("Immunizations:", immunizations);

        // Print to body (old functionality preserved)
        $('body').append('<h3>Allergies:</h3><pre>' + JSON.stringify(allergies, null, 2) + '</pre>');
        $('body').append('<h3>Conditions:</h3><pre>' + JSON.stringify(conditions, null, 2) + '</pre>');
        $('body').append('<h3>Medications:</h3><pre>' + JSON.stringify(medications, null, 2) + '</pre>');
        $('body').append('<h3>Immunizations:</h3><pre>' + JSON.stringify(immunizations, null, 2) + '</pre>');

        ret.resolve(p);
      } catch (e) {
        console.error("Error in processing patient data:", e);
      }
    });
  } else {
    onError();
  }
}

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

})(window);
