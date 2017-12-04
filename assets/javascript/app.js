$(document).ready(function(){

 $("#start").click(program.start);

   //Run Clock  
  setInterval(function(){
    $('.current-time').html(moment().format('hh:mm:ss A'))
  }, 1000);


    // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBD6HWaPINgPExkL_d73ykYfJoyG_0nz7w",
    authDomain: "trainschedule-d22ab.firebaseapp.com",
    databaseURL: "https://trainschedule-d22ab.firebaseio.com",
    projectId: "trainschedule-d22ab",
    storageBucket: "trainschedule-d22ab.appspot.com",
    messagingSenderId: "1073349514186"
  };


  firebase.initializeApp(config);



  function runSchedule() {

    // Declare variables
    var dataRef = firebase.database();
    var editTrainKey = '';
    var firebaseTime = moment();
    var newTime;

    $('.submit').on('click', function(event) {
    $("#input").css('background-color', 'green');
      event.preventDefault();
      // Grab input values
      var nameInputA = $('#nameInput').val().trim();
      var destinationInputA = $('#destinationInput').val().trim();
      // Convert to Unix
      var firstTrainTimeInputA = moment($('#firstTrainTimeInput').val().trim(),"HH:mm").format("X");
      var frequencyInputA = $('#frequencyInput').val().trim();

      console.log(nameInputA);
      console.log(destinantionInputA);
      console.log(firstTrainTimeInputA);
      console.log(frequencyInputA);

      if (nameInputA != '' && destinantionInputA != '' && firstTrainTimeInputA != '' && frequencyInputA != '') {
        // Clear form data
        $('#nameInput').val('');
        $('#destinationInput').val('');
        $('#firstTrainTimeInput').val('');
        $('#frequencyInput').val('');
        $('#trainKey').val('');

        firebaseTime = moment().format('X');


        // Push to firebase
        if (editTrainKey == ''){ 
          dataRef.ref().child('trains').push({
            nameInputA: nameInputA,
            destinationInputA: destinationInputA,
            firstTrainTimeInputA: firstTrainTimeInputA,
            frequencyInputA: frequencyInputA,
            currentTime: fbTime,
          })
        } else if (editTrainKey != '') {
          dataRef.ref('trains/' + editTrainKey).update({
            nameInputA: nameInputA,
            destinationInputA: destinationInputA,
            firstTrainTimeInputA: firstTrainTimeInputA,
            frequencyInputA: frequencyInputA,
            currentTime: fbTime,
          })
          editTrainKey = '';
        }
          $('.help-block').removeClass('bg-danger');
      } else {
          $('.help-block').addClass('bg-danger');
      }

    });

    




    // Update arrival time
    function updateArrivalTime() {
      dataRef.ref().child('trains').once('value', function(snapshot){
        snapshot.forEach(function(childSnapshot){
          firebaseTime = moment().format('X');
          dataRef.ref('trains/' + childSnapshot.key).update({
          currentTime: firebaseTime,
          })
        })    
      });
    };

    setInterval(timeUpdater, 10000);



    // firebase when train added
    dataRef.ref().child('trains').on('value', function(snapshot){
      $('tbody').empty();
      
      snapshot.forEach(function(childSnapshot){
        var trainClass = childSnapshot.key;
        var trainId = childSnapshot.val();
        var firstTimeConverted = moment.unix(trainId.trainTime);
        var timeDiff = moment().diff(moment(firstTimeConverted, 'HH:mm'), 'minutes');
        var timeDiffCalc = timeDiff % parseInt(trainId.trainFreq);
        var timeDiffTotal = parseInt(trainId.trainFreq) - timeDiffCalc;

        if(timeDiff >= 0) {
          newTime = null;
          newTime = moment().add(timeDiffTotal, 'minutes').format('hh:mm A');

        } else {
          newTime = null;
          newTime = firstTimeConverted.format('hh:mm A');
          timeDiffTotal = Math.abs(timeDiff - 1);
        }

        $('tbody').append("<tr class=" + trainClass + "><td>" + trainId.trainName + "</td><td>" +
          trainId.trainDestination + "</td><td>" + 
          trainId.trainFreq + "</td><td>" +
          newTime + "</td><td>" +
          timeDiffTotal + "</td><td><button class='edit btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-pencil'></i></button> <button class='delete btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-remove'></i></button></td></tr>");

    });
    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });


     // firebase as arrival times are updated
    dataRef.ref().child('trains').on('child_changed', function(childSnapshot){
      
      var trainClass = childSnapshot.key;
      var trainId = childSnapshot.val();
      var firstTimeConverted = moment.unix(trainId.trainTime);
      var timeDiff = moment().diff(moment(firstTimeConverted, 'HH:mm'), 'minutes');
      var timeDiffCalc = timeDiff % parseInt(trainId.trainFreq);
      var timeDiffTotal = parseInt(trainId.trainFreq) - timeDiffCalc;

      if(timeDiff > 0) {
        newTime = moment().add(timeDiffTotal, 'minutes').format('hh:mm A');
      } else {
        newTime = firstTimeConverted.format('hh:mm A');
        timeDiffTotal = Math.abs(timeDiff - 1);
      } 

      $('.'+trainClass).html("<td>" + trainId.trainName + "</td><td>" +
        trainId.trainDestination + "</td><td>" + 
        trainId.trainFreq + "</td><td>" +
        newTime + "</td><td>" +
        timeDiffTotal + "</td><td><button class='edit btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-pencil'></i></button><button class='delete btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-remove'></i></button></td>");

    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });


    //remove a train from the schedule
    $(document).on('click','.delete', function(){
      var trainKey = $(this).attr('data-train');
      dataRef.ref("trains/" + trainKey).remove();
      $('.'+ trainKey).remove();
    });

    
    //edit a train on the schedule
    $(document).on('click','.edit', function(){
      editTrainKey = $(this).attr('data-train');
      dataRef.ref("trains/" + editTrainKey).once('value').then(function(childSnapshot) {
        $('#nameInput').val(childSnapshot.val().trainName);
        $('#destinationInput').val(childSnapshot.val().trainDestination);
        $('#firstTrainTimeInput').val(moment.unix(childSnapshot.val().trainTime).format('HH:mm'));
        $('#frequencyInput').val(childSnapshot.val().trainFreq);
        $('#trainKey').val(childSnapshot.key);

      });
      
    });

  };

});



  //object definition
  var program = {
    
      //initial start of the program
      start: function() {
        $("#intro-container").hide();
        $("#schedule").css('display', 'block');
        $("#input").css('display', 'block');
        $("#time").css('display', 'block');
     }
    
  }