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

    var $name = $('#nameInput');
    var $destination = $('#destinationInput');
    var $firstTime = $('#firstTrainTimeInput');
    var $frequency = $('#frequencyInput');
    var $key = $('#trainKey');

    //function to abbreviate code in the future (value() for .val().trim())
    function value($input) {
      return $input.val().trim()
    }


    //function to be used to clear the form of entries
    function clearInputs() {
     $name.val('');
     $destination.val('');
     $firstTime.val('');
     $frequency.val('');
     $key.val('');
   }


   //function to abbreviate code to make future code more direct and less lengthy
   function toTimeStamp(dateString) {
    return moment(dateString, 'HH:mm').format('X');
  }

  //function to abbreviate code to make future code more direct and less lengthy
  function getCurrentTimeStamp() {
    return moment().format('X');
  }

  function readTrainFromInputs() {
    return {
      name: value($name),
      destination: value($destination),
      firstTime: toTimeStamp(value($firstTime)),
      frequency: value($frequency),
      currentTime: getCurrentTimeStamp()
    }
  }

  function areInputsFilled() {
    return value($name) != '' && value($destination) != '' && value($firstTime) != '' && value($frequency) != '';
  }



  function runSchedule() {

    // Declare variables
    var dataRef = firebase.database();
    var editTrainKey = '';
    var firebaseTime = moment();
    var newTime;

    $('.submit').on('click', function(event) {
      event.preventDefault();
      // Grab input values
      if (areInputsFilled) {
        // Clear form data
        var train = readTrainFromInputs();
        clearInputs();

        // Push to firebase
      if (editTrainKey == ''){ 
          dataRef.ref().child('trains').push(train);
      } 
      else {
          dataRef.ref('trains/' + editTrainKey).update(train);
          
      }
      editTrainKey = '';
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
    }


    // firebase when train added
    dataRef.ref().child('trains').on('value', function(snapshot){
      $('tbody').empty();
      
      snapshot.forEach(function(childSnapshot){
        var trainClass = childSnapshot.key;
        var trainId = childSnapshot.val();
        var firstTimeConverted = moment.unix(trainId.firstTime);
        var timeDiff = moment().diff(moment(firstTimeConverted, 'HH:mm'), 'minutes');
        var timeDiffCalc = timeDiff % parseInt(trainId.frequency);
        var timeDiffTotal = parseInt(trainId.frequency) - timeDiffCalc;

        if(timeDiff >= 0) {
          newTime = null;
          newTime = moment().add(timeDiffTotal, 'minutes').format('hh:mm A');

        } else {
          newTime = null;
          newTime = firstTimeConverted.format('hh:mm A');
          timeDiffTotal = Math.abs(timeDiff - 1);
        }

        $('tbody').append('<tr class="tableRow"' + trainClass + "><td>" + trainId.name + "</td><td>" +
          trainId.destination + "</td><td>" + 
          trainId.frequency + "</td><td>" +
          newTime + "</td><td>" +
          timeDiffTotal + "</td><td><button class='delete btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-remove'></i></button></td></tr>"
        );

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
        timeDiffTotal + "</td><td><button class='delete btn' data-train=" + trainClass + "><i class='glyphicon glyphicon-remove'></i></button></td>");

    }, function(errorObject) {
      console.log("Errors handled: " + errorObject.code);
    });


    //remove a train from the schedule
    $(document).on('click','.delete', function(){
      var trainKey = $(this).attr('data-train');
      dataRef.ref("trains/" + trainKey).remove();
      $('.'+ trainKey).remove();
    });

  };
  runSchedule();
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
      
    };