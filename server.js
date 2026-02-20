const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const {formatMessage,formatMessage_usr} = require("./utils/messages");
const {v4 : uuidv4} = require('uuid')
// import { setTimeout } from 'timers/promises';

const mongoose= require("mongoose");
// const createAdapter = require("@socket.io/redis-adapter").createAdapter;
// const redis = require("redis");
require("dotenv").config();
// const { createClient } = redis;
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
const { group } = require("console");
const { read } = require("fs");


const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'html');
// app.engine('html', require('ejs').renderFile);

const botName = "Chat";



mongoose.set('strictQuery', false);
var res= "mongodb+srv://admin-saurav:test123@cluster0.c173uac.mongodb.net/ba2";
mongoose.connect(res, { useNewUrlParser: true });



const indmsgSchema= new mongoose.Schema({
  message: Object,
  msg_id:Object,
  from:Object,
  to:Object,
  time_dt: Date,
  status:Object
});

const indReadToken= new mongoose.Schema({
  usr:Object,
  msg_id:Object
});

const indSeenToken= new mongoose.Schema({
  from:Object,
  to: Object,
  msg_id:Object
});

const usc= new mongoose.Schema(
  {
    usr:Object,
    grp_name:Object,
    socket_id:Object
  })


const ind_msg= new mongoose.model("IND_MSG",indmsgSchema);
const ind_read= new mongoose.model("IND_READ",indReadToken);
const ind_seen= new mongoose.model("IND_SEEN",indSeenToken);
const ind_usc= new mongoose.model("IND_USC",usc);

const grpmsgSchema= new mongoose.Schema({
  message: Object,
  msg_id:Object,
  from:Object,
  grp_name:Object,
  time_dt: Date,
  status:Object
});

const grpSeenToken= new mongoose.Schema({
  grp_name:Object,
  to: Object,
  msg_id:Object
});

const grpinfo= new mongoose.Schema({
  grp_name:Object,
  usr: Object,
});


const grp_msg= new mongoose.model("GRP_MSG",grpmsgSchema);
const grp_seen= new mongoose.model("GRP_SEEN", grpSeenToken);
const grp_info= new mongoose.model("GRP_INFO",grpinfo);



// Run when client connects
io.on("connection", (socket) => {

  socket.on("indroomjoin",({username,room})=>
  {
    const user = userJoin(socket.id, username);
    // console.log(room);

    const uscdb = new ind_usc(
      {
          usr: username,
          grp_name:room,
          socket_id:socket.id
      });
      
      uscdb.save();

    // async function findusr()
    // {
    //   try
    //   {
    //     const query= {usr:{$eq: username}};
    //     const data= await ind_usc.find(query);
    //     const rm= room;

    //     if(data)
    //     {
    //       async function updtusr()
    //       {
    //         await ind_usc.findOneAndUpdate(
    //           {usr:username},
    //           {
    //             $set: {
    //               socket_id:socket.id
    //             },
    //           },
    //           {
    //             upsert: true,
    //             returnDocument: 'after', // this is new !
    //           }
    //         )
    //       }
          
    //       updtusr();
    //     }
    //     else
    //     {

    //       const uscdb = new ind_usc(
    //         {
    //             usr: username,
    //             grp_name:room,
    //             socket_id:socket.id
    //         });
            
    //         uscdb.save();
    //     }
        
    

      // }
      // catch(error)
      // {
      //   console.log(error);
      // }
    // }

    // findusr();

      async function delmsg()
      {
        try
        {
              const query = { usr: { $eq: username}};
              
              const cursor = await ind_read.find(query);
            

              await cursor.forEach(obj=>
                {
      
                  async function run()
                  {
                    // if(!obj.status=="seen"){
                    const doc = await ind_msg.findOneAndUpdate(
                      {msg_id:obj.msg_id},
                      {
                        $set: {
                          status:"delivered"
                        },
                      },
                      {
                        upsert: true,
                        returnDocument: 'after', // this is new !
                      }
                    )
                    
                    const doc1 = await ind_read.findOneAndRemove(
                      {msg_id:obj.msg_id},
                      {
                        upsert: true,
                        returnDocument: 'after', // this is new !
                      }
                    )

                  }
                  run();
                   
                });
        }
        catch(error)
        {
          console.log(error)
        }
      }

      delmsg();

      const delreadmsg= async ()=>
      {
        try
        {
              const query = { from: { $eq: room}, to: {$eq:username}};
              
              const cursor = await ind_seen.find(query);
             
              await cursor.forEach(obj=>
                {
                  const ref_id= obj.msg_id;
                  async function run()
                  {
                    const doc = await ind_msg.findOneAndUpdate(
                      {msg_id:ref_id},
                      {
                        $set: {
                          status:"seen"
                        },
                      },
                      {
                        upsert: true,
                        returnDocument: 'after', // this is new !
                      }
                    )

                    const doc1 = await ind_seen.findOneAndRemove(
                      {msg_id:ref_id},
                      {
                        upsert: true,
                        returnDocument: 'after', // this is new !
                      }
                    )
                    
                  }

                  run();
                   
                });
        }
        catch(error)
        {
          console.log(error)
        }

      }

      delreadmsg();

      

      async function run()
      {
        const query= {from: {$in: [username,room]},to:{$in: [username,room]}};
        
        const cursor = await ind_msg.find(query);

        await cursor.forEach(obj=>
        {
          if(obj.from==username){
            // console.log(obj.status);
            io.to(socket.id).emit("message_usr", formatMessage_usr(obj.from, obj.message,obj.time_dt,obj.status));
          }
          else
          {
            io.to(socket.id).emit("message", formatMessage(obj.from, obj.message,obj.time_dt));
          }
        });
      }

      run();




  });

  socket.on("ind_message",({username,room,msg})=>
  {
    let date= new Date();

    const getuscdata = async ()=> {
      try {
        const data = await ind_usc.findOne({
          usr: room
        });

        // const query= {usc: {$eq:room}, grp_name:{$eq:username}};
        // const cursor = await ind_usc.find(query);

        // const querydel= {usc: {$eq:room}};
        // const cursordel = await ind_usc.find(querydel);

        console.log(username);
        const dataseen = await ind_usc.findOne({
          usr: room,
          grp_name:username
        });

        console.log(data);
        console.log(dataseen);

        const msgid=uuidv4();
        if(dataseen)
        {
          const msgdb = new ind_msg(
            {
                message:msg,
                msg_id:msgid,
                from:username,
                to:room,
                time_dt:date,
                status:"seen"
            });
          
            msgdb.save();
        }
      
        if(data && !dataseen)
        {
          const msgid=uuidv4();
          const msgdb = new ind_msg(
            {
                message:msg,
                msg_id:msgid,
                from:username,
                to:room,
                time_dt:date,
                status:"delivered"
            });
          
            msgdb.save();

            const seendb = new ind_seen(
              {
                 from:username,
                 to:room,
                 msg_id:msgid
              });
            
            seendb.save();
            

        }

        if (!data && !dataseen) {

          const msgdb = new ind_msg(
            {
                message:msg,
                msg_id:msgid,
                from:username,
                to:room,
                time_dt:date,
                status:"sent"
            });
            

            const rddb = new ind_read(
              {
                 usr:room,
                 msg_id:msgid
              });
            
              const seendb = new ind_seen(
                {
                   from:username,
                   to:room,
                   msg_id:msgid
                });
              
              msgdb.save();
              rddb.save();
              seendb.save();
              

        }
      } catch (error) {
        console.log(error);
      }
    }

    getuscdata();

  });

  // socket.on('new_message',({username,msg,room},callback)
  // {
        // callback();
        // cosnt usr= User.find(room);

        // const msgdb = new ind_msg(
        //   {
        //       message:msg,
        //       msg_id:msgid,
        //       from:username,
        //       to:room,
        //       time_dt:date,
        //       status:"sent"
        //   });
        // io.to(usr.id).emit("message_usr", formatMessage_usr(obj.from, obj.message,obj.time_dt,obj.status),function(){console.log("message seen");});
  // });


  //----------------------------------------------------------------------------------------------------------------------------
  //------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------            GRP FUNCTIONS      ------------------------------------------------

  

  socket.on("grproomjoin",({username,room})=>
  {
    const user = userJoin(socket.id, username);
    console.log("hello");

    async function findusr()
    {
      try
      {
        const query= {usr:{$eq: username}};
        const data= await ind_usc.find(query);

        if(data)
        {
          async function updtusr()
          {
            await ind_usc.findOneAndUpdate(
              {usr:username},
              {
                $set: {
                  socket_id:socket.id
                },
              },
              {
                upsert: true,
                returnDocument: 'after', // this is new !
              }
            )
          }
          
          updtusr();
        }
        else
        {
          const uscdb = new ind_usc(
            {
                usr: username,
                socket_id:socket.id,
                grp_name: room
            });
            
            uscdb.save();
         
        }        
      }
      catch(error)
      {
        console.log(error);
      }
    }

    findusr();


    async function addgrpinfo()
    {
      try
      {
        const query= {usr:{$eq: username}, grp_name:{$eq: room}};
        // const data= await grp_info.find(query);

        if( await grp_info.countDocuments(query)==0)
        {
          console.log("nothing");
          const grpdb = new grp_info(
            {
              grp_name: room,
              usr: username
            });
          
            grpdb.save(); 
        }
        
      }
      catch(error)
      {
        console.log(error);
      }
    }

    addgrpinfo();

      async function delmsg()
      {
        try
        {
              const query = { usr: { $eq: username}};
              
              const cursor = await ind_read.find(query);
            

              await cursor.forEach(obj=>
                {
      
                  async function run()
                  {
                    const doc = await ind_msg.findOneAndUpdate(
                      {msg_id:obj.msg_id},
                      {
                        $set: {
                          status:"delivered"
                        },
                      },
                      {
                        upsert: true,
                        returnDocument: 'after', // this is new !
                      }
                    )

                    const doc1 = await ind_read.findOneAndRemove(
                      {msg_id:obj.msg_id},
                      {
                        upsert: true,
                        returnDocument: 'after', // this is new !
                      }
                    )
                  }

                  run();
                   
                });
        }
        catch(error)
        {
          console.log(error)
        }
      }

      delmsg();

      const delreadmsg= async ()=>
      {
        try
        {
              const query = { grp_name: { $eq: room}, to: {$eq:username}};
              
              const cursor = await grp_seen.find(query);
             
              await cursor.forEach(obj=>
                {
      
                  async function run()
                  {
                  
                    const doc1 = await grp_seen.findOneAndRemove(
                      {msg_id:obj.msg_id},
                      {
                        upsert: true,
                        returnDocument: 'after', // this is new !
                      }
                    )

                  }

                  run();
                   
                });
        }
        catch(error)
        {
          console.log(error)
        }

      }

      delreadmsg();

      

      async function run()
      {
        const query= {grp_name:{$eq: room}};
        
        const cursor = await grp_msg.find(query);

        await cursor.forEach(obj=>
        {
          if(obj.from===username){

            if(obj.status==="sent" || obj.status=="delivered")
            {
              async function statres()
              {
                let status_find= "sent";

                const query= {msg_id:{$eq:obj.msg_id}}

                if(await ind_read.countDocuments(query)===0)
                {
                  status_find="delivered";
                }

                if(await grp_seen.countDocuments(query)===0)
                {
                  status_find="seen";
                }

                io.to(socket.id).emit("message_usr", formatMessage_usr(obj.from, obj.message,obj.time_dt,status_find));

                if(status_find==="delivered")
                {
                  const doc= await grp_msg.findOneAndUpdate(
                    {msg_id:obj.msg_id},
                      {
                        $set: {
                          status:"delivered"
                        },
                      },
                      {
                        upsert: true,
                        returnDocument: 'after', // this is new !
                      }
                  )
                }

                if(status_find==="seen")
                {
                  const doc1= await grp_msg.findOneAndUpdate(
                    {msg_id:obj.msg_id},
                      {
                        $set: {
                          status:"seen"
                        },
                      },
                      {
                        upsert: true,
                        returnDocument: 'after', // this is new !
                      }
                  )
                }

              }

              statres();
            }
            else
            {
              io.to(socket.id).emit("message_usr", formatMessage_usr(obj.from, obj.message,obj.time_dt,obj.status));
            }
          }
          else
          {
            io.to(socket.id).emit("message", formatMessage(obj.from, obj.message,obj.time_dt));
          }
        });
      }

      run();

  });


  socket.on("grp_message",({username,room,msg})=>
  {
    let date= new Date();

    const getuscdata = async ()=> {
      try {
      
          const msgid=uuidv4();
          const msgdb = new grp_msg(
            {
                message:msg,
                msg_id:msgid,
                from:username,
                grp_name:room,
                time_dt:date,
                status:"sent"
            });
          msgdb.save();

          async function gentokens()
          {
            
            const query={grp_name:{$eq:room}};
            const cursor= await grp_info.find(query);

            cursor.forEach(obj=>{

            const rddb = new ind_read(
              {
                 usr:obj.usr,
                 msg_id:msgid
              });
            
              const seendb = new grp_seen(
                {
                   grp_name:room,
                   to:obj.usr,
                   msg_id:msgid
                });
              
              rddb.save();
              seendb.save();

            });
          }

          gentokens();

      } catch (error) {
        console.log(error);
      }
    }

    getuscdata();

  });



  //----------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------------------------------------------------------------------------------

  socket.on("joinRoom", ({ username, room}) => {
    const user = userJoin(socket.id, username, room);
    let date = new Date();

    const getuserdata = async ()=> {
      try {
        // const data = await ID.findOne({
        //   u_id: user_id+room
        // });

        const userdata =  await User.findOne({
          usr:user.username,
          g_id:user.room
        });
  
        if (userdata) 
        {

          const getiddata = async ()=> {
            try {
              const data = await ID.findOne({
                u_id: userdata.u_id
              });

              if(data)
              {
                const doc = await ID.findOneAndUpdate(
                  {u_id:userdata.u_id},
                  {
                    $set: {
                      socket_id:socket.id
                    },
                  },
                  {
                    upsert: true,
                    returnDocument: 'after', // this is new !
                  }
                )
              }
        
              if (!data) {
      
                const iddb = new ID(
                  {
                    socket_id: socket.id,
                    u_id: userdata.u_id
                  });
      
                  iddb.save();
              }
            } catch (error) {
              console.log(error);
            }
          }
      
          getiddata();

          
          if(userdata.del==true)
          {

            async function uprun() {
              try {
                const doc = await User.findOneAndUpdate(
                  {usr:user.username},
                  {
                    $set: {
                      del:false,
                      joining: date
                    },
                  },
                  {
                    upsert: true,
                    returnDocument: 'after', // this is new !
                  }
                )
              }
              catch (error) {
                console.log(error);
              }
            }
  
            uprun();
          }
          else
          {
            run();
          }

          
          async function run() {
            try {
              const stamp= userdata.joining;
              console.log(stamp);

              const query = { time_dt: { $gt: stamp }, g_id:{$eq:room} };
              
              const cursor = await Message.find(query);
             
              if ((await Message.countDocuments(query)) === 0) {
                console.log("No messages found hehe!");
              }

              await cursor.forEach(obj=>
                {
                  io.to(user.id).emit("message", formatMessage(obj.usr, obj.message,obj.time_dt));
                });
  
            }
            catch (error) {
              console.log(error);
            }
          }

          socket.join(user.room);
        
            // Welcome current user
            // socket.emit("message", formatMessage(botName, "Welcome to Chat!",date));
        
            // Broadcast when a user connects
            socket.broadcast
              .to(user.room)
              .emit(
                "message",
                formatMessage(botName, `${user.username} has joined the chat`,date)
              );
        
            // Send users and room info
            io.to(user.room).emit("roomUsers", {
              room: user.room,
              users: getRoomUsers(user.room),
            });


        }

        if(!userdata)
        {
          const newId = uuidv4()
          const iddb = new ID(
            {
              socket_id: socket.id,
              u_id: newId
            });
        
            const userdb = new User(
            {
                usr: user.username,
                g_id: user.room,
                u_id: newId,
                joining: date,
                del: false
            });
      
            iddb.save();
            userdb.save();
            
            socket.join(user.room);
        
            // Welcome current user
            socket.emit("message", formatMessage(botName, "Welcome to Chat!",date));
        
            // Broadcast when a user connects
            socket.broadcast
              .to(user.room)
              .emit(
                "message",
                formatMessage(botName, `${user.username} has joined the chat`,date)
              );
        
            // Send users and room info
            io.to(user.room).emit("roomUsers", {
              room: user.room,
              users: getRoomUsers(user.room),
            });
        }

      } catch (error) {
        console.log(error);
      }
    }

    getuserdata();

  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    const roommsg= user.room;
    // console.log(roommsg)

    let date = new Date();

    async function run() {
      try {
        
        const query1 = { g_id: { $eq: roommsg }, del:{$eq:false} };
        
        const cursor1 = await User.find(query1);
       
        if ((await User.countDocuments(query1)) === 0) {
          console.log("No users found!");
        }

        await cursor1.forEach(obj=>
          {
            // io.to(user.id).emit("message", formatMessage(obj.usr, obj.message,obj.time_dt));
            const listuser= obj.u_id;

            async function runid() {
              try {
                
                const query2 = { u_id: { $eq: listuser }};
               
                const cursor2 = await ID.find(query2);
               
                if ((await ID.countDocuments(query2)) === 0) {
                  console.log("No ids found!");
                }
  
                await cursor2.forEach(objn=>
                  {
                    io.to(objn.socket_id).emit("message", formatMessage(user.username, msg,date));
                  });
    
              }
              catch (error) {
                console.log(error);
              }
            }
  
            runid();

          });

      }
      catch (error) {
        console.log(error);
      }
    }

    run();    


    const msgdb = new Message(
      {
            g_id: user.room,
            usr: user.username,
            message:msg,
            time_dt:date, 
      });
    
    msgdb.save();   
    // console.log(data);
    

    // const getdata = async ()=> {
    //   try {
    //     const data = await ID.findOne({
    //       socket_id: socket.id
    //     });
  
    //     if (data) {

    //       const msgdb = new Message(
    //         {
    //               g_id: user.room,
    //               usr: user.username,
    //               message:msg,
    //               time_dt:date, 
    //         });
          
    //       msgdb.save();   
    //       console.log(data);
    //     }
    //   } catch (error) {
    //     console.log(error);
    //   }
    // }

    // getdata();

    // io.to(user.room).emit("message", formatMessage(user.username, msg,date));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => 
  {
    // let date = new Date();
    // const user = userLeave(socket.id);

    // if (user) {

      async function run() {
        try {

          // const data = await User.findOne({
          //   usr: user.username
          // });
          
          const doc = await ind_usc.findOneAndRemove(
            {socket_id: socket.id},
            {
              upsert: true,
              returnDocument: 'after', // this is new !
            }
          )
  
  
        }
        catch (error) {
          console.log(error);
        }
      }
  
      run();

      // socket.emit('leaveroom');
      // io.to(user.room).emit(
      //   "message",
      //   formatMessage(botName, `${user.username} has left the chat`,date)
      // );

      // // Send users and room info
      // io.to(user.room).emit("roomUsers", {
      //   room: user.room,
      //   users: getRoomUsers(user.room),
      // });
  });



  socket.on("leavegrp", () => {
    // const user = userLeave(socket.id);
    const userlv = getCurrentUser(socket.id);
    console.log(userlv);

    let date = new Date();

    async function run() {
      try {
        
        const doc = await ID.findOneAndRemove(
          {socket_id:socket.id},
          {
            upsert: true,
            returnDocument: 'after', // this is new !
          }
        )

        const docu = await User.findOneAndUpdate(
          {usr:userlv.username,
            g_id:userlv.room
          },
          {
            $set: {
              del: true,
            },
          },
          {
            upsert: true,
            returnDocument: 'after', // this is new !
          }
        )


      }
      catch (error) {
        console.log(error);
      }
    }

    run();

    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the group`,date)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }

  });


  socket.on("receive", (groupid) => 
  {
        async function run() {
          try {
            
            const query = { g_id: { $eq: groupid }};
            const cursor = await Message.find(query);
           
            if ((await Message.countDocuments(query)) === 0) {
              console.log("No documents found!");
            }

            await cursor.forEach(obj=>
              {
                io.to(socket.id).emit("message", formatMessage(obj.usr, obj.message,obj.time_dt));
              });

          }
          catch (error) {
            console.log(error);
          }
        }

        run();
  });

  socket.on("leaveroom", () => 
  {
    async function run() {
      try {
        
        const doc = await ind_usc.findOneAndRemove(
          {socket_id:socket.id},
          {
            upsert: true,
            returnDocument: 'after', // this is new !
          }
        )


      }
      catch (error) {
        console.log(error);
      }
    }

    run();
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));









