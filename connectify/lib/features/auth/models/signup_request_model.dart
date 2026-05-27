/// Data model for the signup API request payload.
class SignupRequestModel {
  final String fullName;
  final String username;
  final String email;
  final String password;

  const SignupRequestModel({
    required this.fullName,
    required this.username,
    required this.email,
    required this.password,
  });

  /// Converts the model to a JSON-serializable map for API calls.
  Map<String, dynamic> toJson() {
    return {
      'full_name': fullName,
      'username': username,
      'email': email,
      'password': password,
    };
  }

  /// Creates a [SignupRequestModel] from a JSON map.
  factory SignupRequestModel.fromJson(Map<String, dynamic> json) {
    return SignupRequestModel(
      fullName: json['full_name'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      password: json['password'] as String,
    );
  }

  @override
  String toString() => 'SignupRequestModel(email: $email, username: $username)';
}
