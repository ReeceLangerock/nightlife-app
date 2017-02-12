//const toggleGoingButtons = document.querySelectorAll('[name=attendingButton]');
//toggleGoingButtons.forEach(button => button.addEventListener(('click'), toggleGoing));

/*$(document).ready(function() {
  console.log(sessionStorage.length);
  if(sessionStorage.length != 0){
    console.log("ready");
  reloadSearch(sessionStorage.getItem('search')).then(function(response, error){
    console.log("then");
    sessionStorage.clear();
  });

}
});


function toggleGoing(e){
  e.preventDefault();

  checkAuth(this.id).then(function(response, error){
    if(response == "notAuth"){

      console.log(document.querySelector('[name=lastSearch]').id)
      sessionStorage.setItem('search', document.querySelector('[name=lastSearch]').id);
      window.location.href = './auth/google';
    }
    else{
      window.location.href = window.location.href;
    }

  })
}

function reloadSearch(){
  return new Promise(function(resolve, reject) {
      var url = "/";
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
          if (xhr.readyState == 4 && xhr.status == 200) {
              return resolve(xhr.responseText); // resolve the result of the post
          }
      }
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.send(JSON.stringify({searchQuery: 'chicago'}));
  })

}

function checkAuth(id){
  return new Promise(function(resolve, reject) {
      var url = "/going";
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
          if (xhr.readyState == XMLHttpRequest.DONE) {
              return resolve(xhr.responseText); // resolve the result of the post
          }
      }
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.send(JSON.stringify({barID: id}));
  })
}*/
