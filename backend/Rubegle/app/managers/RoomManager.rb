require "securerandom"

class Room
    attr_accessor :id, :userOne, :userTwo

    def initialize(userOne=nil, usertwo=nil)
      @id = SecureRandom.uuid
      @userOne = userOne
      @userTwo = usertwo
    end

    def append(user)
          if @userOne == nil then
            @userOne = user
            return true
          elsif @userTwo == nil then
            @userTwo = user
            return true
          else
            return false
          end
    end

    def isFull 
          if @userOne != nil || @userTwo != nil then 
            return true
          else
            return false
          end
    end
end