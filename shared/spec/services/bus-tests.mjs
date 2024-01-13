import {MessageBus} from "../../index.js";

describe("bus class", function(){
    beforeEach(function(){
        MessageBus.registrations={};
        MessageBus.unlock();
    });
    describe("register method", function(){
        it("should register 'a' with function '1'", function(){
            //Given
            expect(MessageBus.registrations['a']).toBeUndefined();

            //When
            const handle = MessageBus.register('a', '1', "context").split(':')[1];

            //Then
            expect(MessageBus.registrations['a']).toEqual([{callback: '1', context: "context", handle: handle}]);
        });
        it("should register 'a' with function '1','2'", function(){
            //Given
            expect(MessageBus.registrations['a']).toBeUndefined();

            //When
            const handle1 = MessageBus.register('a', '1', "contextA").split(':')[1];;
            const handle2 = MessageBus.register('a', '2', "contextB").split(':')[1];;

            //Then
            expect(MessageBus.registrations['a']).toEqual([{callback: '1', context: "contextA", handle: handle1},{callback: '2', context: "contextB", handle: handle2}]);
        });
    });
    describe("send method", function(){
        afterEach(function(){
           MessageBus.locked=false; 
        });
        it("should call the registered method", function(){
            //Given
            this.a = function(){};

            spyOn(this, 'a');

            MessageBus.register('1', this.a, this);
          
            //When
            MessageBus.send('1', 'data');

            //Then
            expect(this.a).toHaveBeenCalledWith('data');
       });
       it("should call all registered methods", function(){
            //Given
            this.a = function(){};
            this.b = function(){};

            spyOn(this, 'a');
            spyOn(this, 'b');
            
            MessageBus.register('1', this.a, this);
            MessageBus.register('1', this.b, this);
            
            //When
            MessageBus.send('1', 'data');

            //Then
            expect(this.a).toHaveBeenCalledWith('data');
            expect(this.b).toHaveBeenCalledWith('data');
       });
       it("should call all registered methods", function(){
            //Given
            this.a = function(){};
            this.b = function(){};

            spyOn(this, 'a');
            spyOn(this, 'b');

            MessageBus.register('1', this.a);
            MessageBus.register('1', this.b);

            //When
            MessageBus.send('2', 'data');

            //Then
            expect(this.a).not.toHaveBeenCalled();
            expect(this.b).not.toHaveBeenCalled();
       });

    });
    describe("sendLockable method", function(){
        afterEach(function(){
           MessageBus.locked=false;
        });
        it("should call the registered method", function(){
            //Given
            this.a = function(){};

            spyOn(this, 'a');

            MessageBus.register('1', this.a, this);

            //When
            MessageBus.sendLockable('1', 'data');

            //Then
            expect(this.a).toHaveBeenCalledWith('data');
       });
        it("should not call the registered method when the bus is locked", function(){
            //Given
            this.a = function(){};
            MessageBus.lock();
            spyOn(this, 'a');

            MessageBus.register('1', this.a, this);

            //When
            MessageBus.sendLockable('1', 'data');

            //Then
            expect(this.a).not.toHaveBeenCalledWith('data');
       });
    });
    describe("lock method ", function(){
        it("should set the lock flag on the bus", function(){
            MessageBus.locked=false;
            MessageBus.lock();
            expect(MessageBus.locked).toEqual(true);
        });
        it("should emit a bus-locked", function(){
            MessageBus.locked=false;
            spyOn(MessageBus, "send");

            MessageBus.lock();
            
            expect(MessageBus.send).toHaveBeenCalledWith("bus-locked");
        });
        it("should not emit a bus-locked when alreay locked", function(){
            MessageBus.locked=true;
            spyOn(MessageBus, "send");

            MessageBus.lock();

            expect(MessageBus.send).not.toHaveBeenCalledWith("bus-locked");
        });
    });
    describe("unlock method ", function(){
        it("should set the lock flag on the bus", function(){
            MessageBus.locked=true;
            MessageBus.unlock();
            expect(MessageBus.locked).toEqual(false);
        });
        it("should emit a bus-unlocked", function(){
            MessageBus.locked=true;
            spyOn(MessageBus, "send");

            MessageBus.unlock();

            expect(MessageBus.send).toHaveBeenCalledWith("bus-unlocked");
        });
        it("should not emit a bus-locked when alreay locked", function(){
            MessageBus.locked=false;
            spyOn(MessageBus, "send");

            MessageBus.unlock();

            expect(MessageBus.send).not.toHaveBeenCalledWith("bus-unlocked");
        });
    });

});