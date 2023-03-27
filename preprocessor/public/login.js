function login () {

  var data = new FormData(document.getElementById("login"));

  fetch("/in", { method:"POST", body:data }).then(res => res.text())
                                            .then(resp => {
    if (resp == "OK") {
      location.href = "../experimentos"; }
    else {
      alert(resp);
    }
  })
  .catch(err => console.error(err));
  
  return false;
}