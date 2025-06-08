require_relative "./handler/handler"
require_relative "./sockets/socket-manager"
require_relative "./sockets/call-manager"

def main
  socket_manager_channel = Thread::Queue.new
  call_manager_channel = Thread::Queue.new

  Thread.new do
    socket_manager = SocketManager.new socket_manager_channel
    socket_manager.run
  end

  Thread.new do
    call_manager = RandomCallManager.new call_manager_channel, socket_manager_channel
    call_manager.run
  end

  run Handler.new socket_manager_channel, call_manager_channel
end

main
