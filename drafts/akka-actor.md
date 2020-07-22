
## actor, mailbox, dispatcher
1. one mailbox -> one actor vs mulit mailbox -> one actor
2. mailbox is runnable, has a queue

actor.tell(send) -> dispatcher.dispatch()


dispatcher.attach(actor).

Actor
ActorRef
ActorCell

dispatch(receiver: ActorCell, invocation: Envelope)




1. every actor has its own mailbox.
