/// Data model for the login API request payload.
class LoginRequestModel {
  final String email;
  final String password;

  const LoginRequestModel({
    required this.email,
    required this.password,
  });

  /// Converts the model to a JSON-serializable map for API calls.
  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
    };
  }

  /// Creates a [LoginRequestModel] from a JSON map.
  factory LoginRequestModel.fromJson(Map<String, dynamic> json) {
    return LoginRequestModel(
      email: json['email'] as String,
      password: json['password'] as String,
    );
  }

  @override
  String toString() => 'LoginRequestModel(email: $email)';
}
