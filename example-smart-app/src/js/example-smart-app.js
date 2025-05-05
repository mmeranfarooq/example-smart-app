(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

const outputDiv = document.getElementById("output");

function appendSection(title, content) {
  const section = document.createElement("div");
  section.style.margin = "20px 0";
  section.innerHTML = `<h3>${title}</h3>${content}`;
  outputDiv.appendChild(section);
}

function renderEntries(title, entries, formatterFn) {
  if (!entries || entries.length === 0) {
    appendSection(title, "<p>No data available.</p>");
    return;
  }

  const content = entries.map(entry => `<div style="padding:8px; border-bottom:1px solid #eee;">${formatterFn(entry.resource)}</div>`).join("");
  appendSection(title, content);
}

 function onReady(smart)  {
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

          /* console.log("SMART FHIR Client Object:", smart);

          // Server info
          if (smart.server) {
            console.log("FHIR Server Info:", smart.server);
          }
        
          // Patient access
          if (smart.patient) {
            console.log("Patient object:", smart.patient);
          }
        
          // API object for querying
          if (smart.patient && smart.patient.api) {
            console.log("SMART API object (query interface):", smart.patient.api);
          } */
           const patientId = smart.patient.id;

          smart.api.search({
            type: 'Appointment',
            query: {
              _sort: '-date',
              _count: 20
            }
          }).then(response => {
            renderEntries("Appointments", response.data.entry, res => `
              <strong>Status:</strong> ${res.status || 'N/A'}<br>
              <strong>Start:</strong> ${res.start || 'N/A'}<br>
              <strong>Reason:</strong> ${res.reason?.text || 'N/A'}<br>
              <strong>Participants:</strong> ${res.participant?.map(p => p.actor?.display || p.actor?.reference).join(', ') || 'N/A'}
            `);
          }).catch(error => {
            console.error("Error fetching appointments:", error);
          });

  // AllergyIntolerance
  smart.api.search({ type: 'AllergyIntolerance', query: { patient: patientId } }).then(response => {
    renderEntries("Allergies", response.data.entry, res => `
      <strong>Allergy:</strong> ${res.substance?.text || 'Unknown'}<br>
      <strong>Status:</strong> ${res.status || 'N/A'}<br>
      <strong>Criticality:</strong> ${res.criticality || 'N/A'}
    `);
  });

  // Procedure
  smart.api.search({ type: 'Procedure', query: { patient: patientId } }).then(response => {
    renderEntries("Procedures", response.data.entry, res => `
      <strong>Code:</strong> ${res.code?.text || 'Unknown'}<br>
      <strong>Status:</strong> ${res.status || 'N/A'}<br>
      <strong>Date:</strong> ${res.performedDateTime || res.performedPeriod?.start || 'N/A'}
    `);
  });

  // Encounter
  smart.api.search({ type: 'Encounter', query: { patient: patientId } }).then(response => {
    renderEntries("Encounters", response.data.entry, res => `
      <strong>Type:</strong> ${res.type?.[0]?.text || 'Unknown'}<br>
      <strong>Status:</strong> ${res.status || 'N/A'}<br>
      <strong>Date:</strong> ${res.period?.start || 'N/A'}
    `);
  });

  // Condition
  smart.api.search({ type: 'Condition', query: { patient: patientId } }).then(response => {
    renderEntries("Conditions", response.data.entry, res => `
      <strong>Condition:</strong> ${res.code?.text || 'Unknown'}<br>
      <strong>Clinical Status:</strong> ${res.clinicalStatus?.text || 'N/A'}<br>
      <strong>Onset:</strong> ${res.onsetDateTime || 'N/A'}
    `);
  });

  // DiagnosticReport
  smart.api.search({ type: 'DiagnosticReport', query: { patient: patientId } }).then(response => {
    renderEntries("Diagnostic Reports", response.data.entry, res => `
      <strong>Test:</strong> ${res.code?.text || 'Unknown'}<br>
      <strong>Status:</strong> ${res.status || 'N/A'}<br>
      <strong>Effective Date:</strong> ${res.effectiveDateTime || 'N/A'}
    `);
  });

  // Immunization
  smart.api.search({ type: 'Immunization', query: { patient: patientId } }).then(response => {
    renderEntries("Immunizations", response.data.entry, res => `
      <strong>Vaccine:</strong> ${res.vaccineCode?.text || 'Unknown'}<br>
      <strong>Status:</strong> ${res.status || 'N/A'}<br>
      <strong>Date:</strong> ${res.date || 'N/A'}
    `);
  });
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
