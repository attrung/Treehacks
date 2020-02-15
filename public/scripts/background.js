var counter = 0;
function changeBG(){
    var imgs = [
        "url(https://images.unsplash.com/photo-1494959764136-6be9eb3c261e?dpr=2&fit=crop&fm=jpg&h=825&ixlib=rb-0.3.5&q=50&w=1450)",
        "url(https://images.unsplash.com/photo-1524813686514-a57563d77965?dpr=2&fit=crop&fm=jpg&h=825&ixlib=rb-0.3.5&q=50&w=1450)",
        "url(https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?dpr=2&fit=crop&fm=jpg&h=825&ixlib=rb-0.3.5&q=50&w=1450)",
        "url(https://images.unsplash.com/photo-1499351094445-76ef13077fb9?dpr=2&fit=crop&fm=jpg&h=825&ixlib=rb-0.3.5&q=50&w=1450)",
        "url(https://images.unsplash.com/36/hGibbjg0Rb2fUIoMtU5l__DSC8099.jpg?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&q=50&w=1450)",
        "url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?dpr=2&fit=crop&fm=jpg&h=825&ixlib=rb-0.3.5&q=50&w=1450)",
        "url(https://images.unsplash.com/photo-1508916319692-80a99da75692?dpr=2&fit=crop&fm=jpg&h=825&ixlib=rb-0.3.5&q=50&w=1450)",
        "url(https://images.unsplash.com/photo-1560188623-5c06788252bd?dpr=2&fit=crop&fm=jpg&h=825&ixlib=rb-0.3.5&q=50&w=1450)"
      ]

    if(counter === imgs.length) counter = 0;
    $("body").css("background-image", imgs[counter]);

    counter++;
}

  setInterval(changeBG, 2000);
