import 'package:flutter/material.dart';
import 'package:connectify/features/feed/widgets/feed_list.dart';

class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Colors.transparent, // transparent to let AppScaffold background show through
      body: FeedList(),
    );
  }
}
