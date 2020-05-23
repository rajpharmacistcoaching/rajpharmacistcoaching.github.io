var firebaseConfig = {
  apiKey: "AIzaSyBVlYeWQtDx5oQSNhdzlKqlvBFVzwPn6AA",
  authDomain: "onlinetestseries-11b7a.firebaseapp.com",
  databaseURL: "https://onlinetestseries-11b7a.firebaseio.com",
  projectId: "onlinetestseries-11b7a",
  storageBucket: "onlinetestseries-11b7a.appspot.com",
  messagingSenderId: "752664073790",
  appId: "1:752664073790:web:74dc30a2d9bd4fa998e36f",
  measurementId: "G-G7PEPWRWCM"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();


var globalData = {'siteName':'pharmacist'}


firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    globalData.user = user
    console.log('Logged In :',user.uid);
    setTemplate('viewTemplate','loginPage')
    getOldExamList(function() {
      setTemplate('viewTemplate','dashboardPage')
    });
  } else {
    console.log('User not logged in');
    setTemplate('viewTemplate','loginPage')
  }
});


function getOldExamList(callback) {
  var docRef = db.collection(globalData.siteName).doc("oldExamList");
  docRef.get().then(function(doc) {
    if (doc.exists) {
      var oldExamList = JSON.parse(doc.data().oldExamList)
      globalData.oldExamList = oldExamList;
      console.log("Got data successfully.");
      if (callback) { callback(); }
    }
    loading('hide');
  })
}


function doLogin(){
  loading('show');
  console.log('Logging In');
  var em = document.getElementById("inputEmail").value+'@'+globalData.siteName+'.com';
  var pas = document.getElementById("inputPassword").value;
  console.log(em,pas);
  firebase.auth().signInWithEmailAndPassword(em, pas)
  .then(function(k){ console.log("LogIn successful, rediecting to HomePage"); })
  .catch(function(error) {
    console.log(error);
    alert(error.message)
    loading('hide')
  });
};

function doLogout(){
  loading('show')
  console.log('logOut');
  firebase.auth().signOut().then(function() {
    globalData = {'siteName':'pharmacist'}
    console.log("Log-out successful, rediecting to LoginPage");
    loading('hide')
  }).catch(function(error) {
    console.log("An error happened.");
    alert(error.message)
    loading('hide')
  });
};
doLogout();







function goDashboard(){ setTemplate('viewTemplate','dashboardPage') }

// upload paperFunction start
function showUploadPaper(){
  setTemplate('viewTemplate','paperuploadPage',function() {
    document.getElementById('navBar').classList.remove('hideNavBar')
  })
}

function uploadExamPaper(){
  var paperName = document.getElementById('paperName').value
  var paperId = new Date().toJSON().replace(/-|T|\.|Z|\:/g,"")
  var finalData = {
    name: paperName,
    ques: prepareExamPaper(document.getElementById('paperData').value),
    dateTime: firebase.firestore.FieldValue.serverTimestamp()
  }
  if (globalData.oldExamList==undefined) {
    getOldExamList(up2(paperName, paperId))
  }else{up2(paperName, paperId)}

}

function up2(paperName, paperId) {
  var tempListOldExam = JSON.parse(JSON.stringify(globalData.oldExamList))
  tempListOldExam[paperId] = {name:paperName, dateTime:new Date().toJSON().split('T')[0]}
  var finalData = {
    siteName:globalData.siteName,
    paperId:paperId,
    oldExamList:{oldExamList:JSON.stringify(tempListOldExam)},
    finalPaperData:{
      name: paperName,
      ques: prepareExamPaper(document.getElementById('paperData').value),
      dateTime: firebase.firestore.FieldValue.serverTimestamp()
    },
  }
  uploadBatchUpdate(finalData)

}



function uploadBatchUpdate(finalData) {
  loading('show');
  var batch = db.batch();
  batch.set( db.collection(finalData.siteName).doc(finalData.paperId) , finalData.finalPaperData);
  batch.set( db.collection(finalData.siteName).doc('oldExamList')     , finalData.oldExamList);
  batch.commit().then(function () {
    console.log('Paper created successfully.');
    document.getElementById('paperName').value = ""
    document.getElementById('paperData').value = ""
    globalData.oldExamList[finalData.paperId] = {name:finalData.finalPaperData.name, dateTime:new Date().toJSON().split('T')[0]}
    loading('hide');
    alert('Paper uploaded successfully.')
  }).catch(function(error) {
    console.log(error);
    alert(error.message)
    loading('hide');
  });
}

function prepareExamPaper(paperdata){
  var ques = []
  for (each of paperdata.split("###")){
    var dataques = each.split("\t")
    if(dataques[6]){
      var tempJson = {
        ques:dataques[1].trim(),
        options:{
          "a":dataques[2].trim(),
          "b":dataques[3].trim(),
          "c":dataques[4].trim(),
          "d":dataques[5].trim()
        },
        correct:dataques[6].trim().toLowerCase()
      }
      if(dataques[7]){ tempJson.explain = dataques[7].trim()  }
      ques.push(tempJson)
    }
  }
  return JSON.stringify({questions:ques})
}
// upload paperFunction end



// delete paperFunction start
function showDeletePaper(){
  setTemplate('viewTemplate','paperdeletePage',function() {
    createDelList()
    document.getElementById('navBar').classList.remove('hideNavBar')
  })
};


function createDelList() {
  var elm2 = document.getElementById('oldExamList')
  var tempHtml = ''
  for (each of Object.keys(globalData.oldExamList).sort(function(a, b){return b-a})){
    tempHtml += '<option id="'+each+'">'+globalData.oldExamList[each]["name"]+'</option>'
  }
  elm2.innerHTML = tempHtml
}



function deleteExamPaper() {
  var paperId = document.getElementById('oldExamList').selectedOptions[0].id
  var tempList = processOldExamList(paperId)
  var finalData = {
    siteName : globalData.siteName,
    paperId : paperId,
    oldExamList : {oldExamList:tempList}
  }
  batchUpdate(finalData)
}



function batchUpdate(finalData) {
  loading('show');
  var batch = db.batch();
  batch.delete(db.collection(finalData.siteName).doc(finalData.paperId));
  batch.set( db.collection(finalData.siteName).doc('oldExamList'), finalData.oldExamList);
  batch.commit().then(function () {
    console.log('Paper Deleted successfully.');
    delete globalData.oldExamList[finalData.paperId]
    createDelList()
    loading('hide');
  }).catch(function(error) {
    console.log(error);
    alert(error.message)
    loading('hide');
  });
}

function processOldExamList(paperId) {
  var tempList = JSON.parse(JSON.stringify(globalData.oldExamList))
  delete tempList[paperId]
  return JSON.stringify(tempList)
}


// delete paperFunction end




function setTemplate(id,templateName, callback) {
  console.log(id,templateName);
  document.getElementById('navBar').classList.add('hideNavBar')
  $('#'+id).load('view/'+templateName+'.html', function(){ if (callback) {callback();} });
};



function showPopUp(tempHtml) {
  var modal = document.getElementById("myModal");
  modal.style.display = "block";
  if (tempHtml.bodyHtml) { document.getElementById('modalBody').innerHTML = tempHtml.bodyHtml; }
  if (tempHtml.footerHtml) { document.getElementById('modalFooter').innerHTML = tempHtml.footerHtml; }

}
function closePopUp() {
  var modal = document.getElementById("myModal");
  modal.style.display = "none";
}

function loading(showHide) {
  if(showHide=='show'){
    var bodyHtml = '<div id="loading-bar-spinner" class="spinner"><div class="spinner-icon"></div></div> \
    <h2 id="loading-text">Loading Please Wait . . .</h2>'
    showPopUp({bodyHtml:bodyHtml})
  }else if (showHide=='hide') {
    closePopUp()
  }

}
