require "json"
require "faye/websocket"
require "securerandom"

class Handler
  def initialize socket_channel, call_channel
    @socket_manager_channel = socket_channel    
    @call_manager_channel = call_channel
  end

  def call(env)
    if Faye::WebSocket.websocket?(env) then
      socket = Faye::WebSocket.new env
      socket_id = SecureRandom.uuid

      @socket_manager_channel << { "type" => "socket", "socket_id" => socket_id, "socket" => socket }

      socket.on :message do 
        |event|
          event_dto = JSON.parse event.data
          case event_dto["type"]
            when "initial"
              @call_manager_channel << socket_id
            when "send"
              @socket_manager_channel << { "type" => "send", "socket_id" => event_dto["to"], "data" => JSON.generate(event_dto["data"]) }
            else
              puts "WRONG DTO RECEIVED FROM SOCKET :: #{socket_id}"
          end
      end

      socket.on :close do
        |event|
          @socket_manager_channel << { "type" => "remove", "socket_id" => socket_id }
      end

      socket.rack_response
    else
      [405, { "Content-Type" => "application/json" }, [ JSON.generate({ "message" => "Not Found" }) ]]
    end
  end
end
