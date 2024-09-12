require_relative "../managers/RoomManager.rb"

class SignalChannel < ApplicationCable::Channel
  @@rooms = [] 

  def subscribed

  end

  def receive(data)
    if @@rooms.length == 0 then
      room = Room.new
      room.append(data["username"])
      @@rooms << room
    else
      room = @@rooms.pop
      room.append(data["username"])
      sleep 8
      ActionCable.server.broadcast("room#{room.id}", {
      :type => "send"
    })
    end
    stream_from "room#{room.id}"
    sleep 5
    ActionCable.server.broadcast("room#{room.id}", {
      :roomId => "room#{room.id}",
      :type => "roomId"
    })
  end

  def exchangeSdp(data)
    ActionCable.server.broadcast("#{data["roomId"]}", {
      :sdp => data["sdp"],
      :id => data["id"],
      :type => "sdp"
    })
  end

  def exchangeIce(data)
    ActionCable.server.broadcast("#{data["roomId"]}", {
      :ice => data["ice"],
      :id => data["id"],
      :type => "ice"
    })
  end

  def unsubscribed
    stop_all_streams
  end
end
