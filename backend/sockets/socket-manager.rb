class SocketManager
  def initialize channel
    @in_channel = channel
    @sockets = Hash.new
  end

  def run
    while true
      socket_manager_dto = @in_channel.pop

      case socket_manager_dto["type"]
        when "socket"
          if socket_manager_dto["socket_id"] then
            @sockets[socket_manager_dto["socket_id"]] = socket_manager_dto["socket"]
          end
 
        when "send"
          if socket_manager_dto["socket_id"] then
            if socket_manager_dto["data"] then
              puts "sending to #{socket_manager_dto["socket_id"]}"
              @sockets[socket_manager_dto["socket_id"]].send(socket_manager_dto["data"])
            end
          end

        when "remove"
          @sockets.delete(socket_manager_dto["socket_id"])
 
        when "stop"
          for key, _ in @sockets do
            @sockets[key].close
          end

          @sockets.clear
          
          break
        else
          next
      end
    end
  end
end