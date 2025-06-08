require "json"

class RandomCallManager
  def initialize call_channel, socket_channel
    @call_manager_channel = call_channel
    @socket_manager_channel = socket_channel
    @socket = nil
  end

  def run
    while true do
      socket_id = @call_manager_channel.pop
      
      if !@socket then
        @socket = socket_id
      else
        if @socket != socket_id then
          @socket_manager_channel << { "type" => "send", "socket_id" => @socket, "data" => JSON.generate({ "type" => "start", "local_id" => @socket, "remote_id" => socket_id }) }
          @socket = nil        
        end 
      end
    end
  end
end