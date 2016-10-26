from channels import Group
from channels.sessions import channel_session
from .models import MapRoom


@channel_session
def ws_connect(message):
    import pdb; pdb.set_trace()
    prefix, label = message['path'].strip('/').split('/')
    room = MapRoom.objects.get(label=label)
    Group('map_room-' + label).add(message.reply_channel)
    message.channel_session['map_room'] = room.label


@channel_session
def ws_receive(message):
    label = message.channel_session['map_room']
    room = MapRoom.objects.get(label=label)
    data = json.loads(message['text'])
    m = room.messages.create(handle=data['handle'], message=data['message'])
    Group('map_room-'+label).send({'text': json.dumps(m.as_dict())})


@channel_session
def ws_disconnect(message):
    label = message.channel_session['map_room']
    Group('map_room-'+label).discard(message.reply_channel)
