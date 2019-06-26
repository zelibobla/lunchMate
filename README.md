# LunchMate


## The idea
LunchMate is a telegram bot that takes care of broadcasting your colleagues about getting to lunch with you here and now. The algorithm is as follows:
1. Register with bot lunchMate by typing /start
2. Ask your office mates to do the same
3. Form the list of mates you'd like to share the lunch with
4. When you're hungry just ask bot to find a mate for getting to lunch with you into particular place right now. Bot will send invitation one by one walking through your predefined list. Every invitation recipient has 1 minute to accept. If not accepted, the invitation cancels and next person from the list invited. This repeats till the accepted invitation or the end of list.
5. Enjoy your lunch!

## The technology
The bot is written in AWS Lambda as a way to practice with Lambdas and do something useful. Would like to contribute? Submit your PR.