import 'package:flutter_test/flutter_test.dart';
import 'package:connectify/app.dart';

void main() {
  testWidgets('App renders splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const ConnectifyApp());
    // Verify the splash screen is displayed
    expect(find.text('Connectify'), findsOneWidget);
  });
}
