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
      sleep 2
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
      :type => "sdp",
      :username => data["username"]
    })
  end

  def exchangeIce(data)
    if data["ice"] == nil then
      return
    else
      ActionCable.server.broadcast("#{data["roomId"]}", {
        :ice => data["ice"],
        :id => data["id"],
        :type => "ice"
      })  
    end 
  end

  def disconnect(data)
    ActionCable.server.broadcast("#{data["roomId"]}", {
      :type => "disconnect"
    })
    if @@rooms.length != 0 then
      tempRoom = @@rooms.pop
      if data["roomId"] != "room#{tempRoom.id}" then
        stop_stream_from "#{data["roomId"]}"
        @@rooms << tempRoom
      end
    end
  end

  def success(data)
    ActionCable.server.broadcast("#{data["roomId"]}", {
      :id => data["id"],
      :type => "success",
      :username => data["username"]
    }) 
  end

  def unsubscribed
    stop_all_streams
  end
end
