<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $name = $_POST["name"];
  $email = $_POST["email"];
  $subject = $_POST["subject"];
  $message = $_POST["message"];

  $to = "arieleon995@gmail.com";
  $headers = "From: $name <$email>";
  $body = "Subject: $subject\n\n$message";

  if (mail($to, $subject, $body, $headers)) {
    echo "Thank you for your message!";
  } else {
    echo "There was a problem sending your message. Please try again.";
  }
}
?>
