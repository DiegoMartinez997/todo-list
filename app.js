//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require ("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb+srv://admin_diego:admin123@clustertest.4rv2lv8.mongodb.net/todolistDB")


const itemSchema = ({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const itemOne = new Item({name: 'Welcome to your todo list!'});
const itemTwo = new Item({name: 'press + to add a new item'});
const itemThree = new Item({name: '<--- click this to delete an item'});

const defaultItems= [itemOne, itemTwo, itemThree];

const listSchema = ({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  
  Item.find({}).then(function(foundItems){
    res.render("list", {listTittle: "Today", newListItems: foundItems});

    if (foundItems.length === 0){
      Item.insertMany(defaultItems);
    }

  })
  .catch (function(err){
    console.log(err);
  });
});

app.get("/:customListName",async function(req, res){

    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName})
      .then(function (foundList){
        if (!foundList){
          //console.log("Page does not exist");
          //create new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
        } else {
          //show existing list
          res.render("list",{listTittle: foundList.name, newListItems: foundList.items});
        }
      });

  });
   
app.post("/", async function(req, res){

  const itemName = req.body.newItem;
  const listName =req.body.list;

  console.log("List name is " + listName);

  const newItem = new Item({
    name: itemName,
  });

  if(listName === "Today"){
    try{
      await newItem.save();
      console.log("New item added to DB " + itemName);
      res.redirect("/");
    } catch(error){
      console.log("Error fail adding a new item to database", error);
    }
  } else {
    const foundList = await List.findOne({ name: listName });
    if(!foundList){
      console.log("list not found");
    }
    try {
      foundList.items.push(newItem)

      await foundList.save();

      res.redirect("/" + listName);
    }catch (error){
      console.log("Error adding a new item", error);
    }
  }
 
});


app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    try {
      const item = await Item.findByIdAndDelete(checkedItemId);
    } catch(err){
      console.log(err);
    }
    return res.redirect("/");
  }

  let foundList = await List.findOne({name: listName}).exec();
  foundList.items.pull({_id: checkedItemId});
  foundList.save();
  return res.redirect("/" + listName);
});
      



app.get("/about", function(req, res){
  res.render("about");
});

//app.listen(3000, function() {
 // console.log("Server started on port 3000");
//});

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})