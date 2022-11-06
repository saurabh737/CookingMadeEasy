import { StatusBar } from 'expo-status-bar';
import { StyleSheet,ImageBackground, Text, View, Image, TouchableOpacity, TextInput, FlatList, Button, SafeAreaView } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DropDownPicker from 'react-native-dropdown-picker';
import { Video } from 'expo-av';
import { Fontisto } from '@expo/vector-icons';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { SearchBar, Card } from "react-native-elements";


const Stack = createNativeStackNavigator();

const firebaseConfig = {
  apiKey: "AIzaSyBS0hk6gW7PS6pzXEXVttpp8D6oSWk1h-A",
  authDomain: "w11c2-df037.firebaseapp.com",
  projectId: "w11c2-df037",
  storageBucket: "w11c2-df037.appspot.com",
  messagingSenderId: "117919717569",
  appId: "1:117919717569:web:87c842d71587c92ed7dc40"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let foodConstURL = "https://tasty.p.rapidapi.com/recipes/list"

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splashpage">
        <Stack.Screen name="Splashpage" component={Splashpage} options={{headerShown: false}}/>
        <Stack.Screen name="All Recipes" component={HomePage} />
        <Stack.Screen name="Calorie Counter" component={CalorieCounter} />
        <Stack.Screen name="Details" component={RecipeInfo} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function RecipeInfo(props){
  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});
  // console.log(props.route.params.text)
  const metadata = props.route.params.text;
  return (
    <View style={styles.homescreen}>
      <Video
        ref={video}
        style={styles.video}
        source={{
          uri: props.route.params.text.video_url,
        }}
        useNativeControls
        resizeMode="contain"
        isLooping = "false"
        onPlaybackStatusUpdate={status => setStatus(() => true)}
      />
      <Text> Instructions</Text>
      <FlatList
        data={metadata.instructions}
        // renderItem={({ item,index }) => {InstrDisplay}}
        renderItem = {({ item, index }) => {
                console.log("item is",item);
                // var array = JSON.parse(item);
          return(
            <View >
              <View >
                <Text style={styles.status}> {index+1}. {item}</Text>
                {/* <Author name={counter+1}{item.display_text}/> */}
              </View>
            </View> 
          )
        } 
      }
        keyExtractor={item => item.id}
      />
    </View>
    ) 
}

const InstrDisplay = ({item}, counter = 0) => (
      <View >
        <View >
          <Text style={styles.status}> - {item.display_text}</Text>
          {/* <Author name={counter+1}{item.display_text}/> */}
        </View>
      </View>     
    )

function Splashpage(props) {
  return (
    <View style={{flex:1,}}>
      <ImageBackground source={require("./assets/AdobeStock_141195680.jpeg")}  resizeMode="cover" style={styles.backgroundImage}>
    <View style={styles.homescreen}>
      
      {/* <Text style={styles.welcome} onPress={props.clickFunction}>Cooking Made Easy</Text> */}
      <View style={styles.homeposter}>
      <Image style={styles.homeImage} source={require('./assets/logo-no-background.png')}/>
    </View>
      <TouchableOpacity
        style={styles.buttonHome}
        onPress={()=>props.navigation.navigate('All Recipes', { text: "All Recipes" })}
      >
        <Text style = {styles.appButtonText}>Explore Recipes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonHome}
        onPress={()=>props.navigation.navigate('Calorie Counter', { text: "Home Screen" })}
      >
        <Text style = {styles.appButtonText}>Calorie Counter</Text>
      </TouchableOpacity>
      
      {props.route.params && (
        <Text>Information from {props.route.params.text}!</Text>
      )}
      </View>
      </ImageBackground>
    </View>
  );
}

function HomePage(props) {
  const [movies, setMovies] = useState([])

  const saveData = async(foodObj)=>{
    // console.log("Trying to save", JSON.stringify(foodObj ))
    await setDoc(doc(db, "food", foodObj.id.toString()), foodObj);
  }

  const getData = async()=>{
    const querySnapshot = await getDocs(collection(db, "food"));
    let movieRes = []
    querySnapshot.forEach(doc => {
      // console.log(doc.id, '=>', doc.data());
      movieRes.push(doc.data())
    });
    return movieRes
  }

  const getReviews = (searchKey) => {
    let foodURL = foodConstURL;
    if (searchKey.length > 0){
      foodURL = `${foodConstURL}?from=0&size=60&q=${searchKey}`
    }else{
      foodURL = `${foodConstURL}?from=0&size=300` 
    }
    console.log(foodURL)
    axios({
    method: 'get',
    url: foodURL,
    headers: {
      'X-RapidAPI-Key': '5cd3250e74msh2fe99043d4e8234p10d6fdjsn52522327a998',
      'X-RapidAPI-Host': 'tasty.p.rapidapi.com'
    }
    }).then((response) => {
      let movieList = response.data.results
      let movieArray = []
      console.log(movieList.length,"===============================")
      movieList.forEach((item, id)=>{
        let d = new Date(item.created_at*1000);
        let instArr = []
        if (item.name && item.thumbnail_url && (item.original_video_url || item.video_url) && item.instructions){
          item.instructions.forEach((instr, id) => {
            instArr.push(instr.display_text)
          })
          let movieObject = {
          id:item.id,
          key:item.id,
          title:item.name,
          name: (item.description && item.description.length > 20) ? `${item.description.slice(0, 50)}...`: item.description,
          date:`${d.getMonth()+1}-${d.getDay()}-${d.getFullYear()}`,
          source:item.thumbnail_url?item.thumbnail_url:"",
          metadata:{
            instructions: instArr,
            user_ratings: item.user_ratings,
            tags: item.tags,
            video_url: item.original_video_url ? item.original_video_url : item.video_url,
            id: item.id
          }
        }
        console.log(item.name, item.id)
        if (!(searchKey.length > 0)){
          saveData(movieObject)
        }
          movieArray.push(movieObject)
        } 
      })
      movieArray.sort((a,b) => b.metadata.user_ratings.count_positive - a.metadata.user_ratings.count_positive)

      setMovies([...movieArray])
    });
  }

  useEffect(()=>{

    // getReviews("")
    (async()=>{
      let movieArray = await getData()
      if (movieArray.length !== 0)
        setMovies([...movieArray])
      else
        getReviews("")
      })()

  },[])

  return (
    <SafeAreaView style={styles.containerFoodPanel}>
      <SearchPanel searchFunction={getReviews}/>
        <FlatList
          data={movies}
          renderItem={(item) => foodPanel(item, props)}
          keyExtractor={item => item.id}
          ListFooterComponent = {Footer}
          // horizontal={false}
          // numColumns={2}
          // ListFooterComponentStyle={styles.footer}
        />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function SearchPanel(props){
  const [text, setText] = useState("")

  return(
      <View style={styles.panelBody}>              
        {/* <TextInput
          style={styles.searchInput}
          placeholder="Enter Ingredient name"
          onChangeText={(value)=>setText(value)}
          value={text}
        /> */}
        <View style={styles.searchBarView}>
        <SearchBar
          Color="#ffff"
          containerStyle={styles.searchBar}
          placeholder="Looking for ??"
          lightTheme
          round
          searchIcon={{ color: "#fff", solid: true, size: 35 }}
          inputStyle={{ color: "#fff" }}
          onChangeText={(value)=>setText(value)}
          showCancel
          value={text}
        />
    </View>
        {/* <Button 
          title="Search"
          onPress={()=>{
            props.searchFunction(text)
            setText("")}
          }/> */}
          <TouchableOpacity
        onPress={() => {
          /* Use Movie Review API to Search*/

          props.searchFunction(text);
          setText("");
        }}
      >
        {/* <Text
        >
          Search
        </Text> */}
        <View style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
        </View>
      </TouchableOpacity>
      </View>     
    )
}

const MoviePanel = ({item}, props) => (
      <View style={styles.panelBody2}>
        <View style={styles.text}>
          <Title title={item.title}/>
          <Author name={item.name}/>
          <PubDate date={item.date}/>
          <Guide id={item.id} propsData = {props} metadata = {item.metadata}/>
        </View>
        <Poster source={item.source}/>
      </View>     
    )

const foodPanel = ({item}, props) =>(
  (
    <View style={styles.card1}>
      <View style={styles.map1}>
        <Image resizeMode= "cover" style={styles.foodImage1} source={{uri:item.source}}/>
      </View>
      <View style={styles.header1}>
        <View style={styles.subHeader1}>
          <Text style={styles.subHeaderText1}>
            {item.title}
          </Text>
          {/* <Text style={ styles.priceHigh }>
            
              <Fontisto name="like" size={20} color="green" />
              {" "}{item.metadata.user_ratings.count_positive}{" "}
              <Fontisto name="dislike" size={20} color="red" />
              {" "}{item.metadata.user_ratings.count_negative}
            
          </Text> */}
        </View>
        <Text style={ styles.priceHigh1 }>
            
              <Fontisto name="like" size={18} color="green" />
              {"  "}{item.metadata.user_ratings.count_positive}{"      "}
              <Fontisto name="dislike" size={18} color="red" />
              {"  "}{item.metadata.user_ratings.count_negative}
            
          </Text>
        <Text style={{ color: "darkgrey" }}>
          <Guide id={item.id} propsData = {props} metadata = {item.metadata}/> 
        </Text>
      </View>
    </View>
  )
)
function Footer(props){
  return(
    <TouchableOpacity style={styles.footer}>
     <Text style={styles.status} onPress={props.clickFunction}>more</Text>
    </TouchableOpacity>
    )
}

function Title(props){
  return(
      <Text style={styles.captionDisplay}>{props.title}</Text>
    )
}

function Author(props){
  return(
    <Text style={styles.status}>{props.name}</Text>
    )
}

function PubDate(props){
  return(
    <Text style={styles.status}>{props.date}</Text>
    )
}

function Guide(props){
  const [data, setData] = useState(null)
  // setData(props.metadata)
  const getMoreInfo = (recipeId) => {
    setData(recipeId)
  }
  useEffect(()=>{
    data && props.propsData.navigation.navigate('Details', { text: data })
  },[data])
  // console.log("Hello=========================", props.id)
  return(
    <TouchableOpacity 
      //  onPress={props.getMoreInfo(props.id)}
    >
     <Text style={styles.hide} onPress={()=>getMoreInfo(props.metadata)} >Step-by-Step Guide</Text>
     </TouchableOpacity>
    )
}

function Poster(props){
  return(
    <View style={styles.poster}>
      <Image style={styles.image} source={{uri:props.source}}/>
    </View>)
}

function ControlPanel(props){
  return(
    <View style={styles.panelAdd}>
      <AButton aId="more-review" aCaption="More Reviews +" clickFunction={props.movieFunction}/>
      <AButton aId="show-posters" aCaption="Show Posters" clickFunction={props.showFunction}/>
    </View>)
}

function AButton(props){
  return(
    <TouchableOpacity >
     <Text style={styles.status} id={props.aId} onClick={props.clickFunction}>{props.aCaption}</Text>
</TouchableOpacity>
    )
}


function CalorieCounter(props) {
  const [age, onChangeAge] = React.useState(null);
  const [height, onChangeHeight] = React.useState(null);
  const [gender, onChangeGender] = React.useState(null);
  const [open, setOpen] = useState(false);
  const [weight, onChangeWeight] = React.useState(null);
  const [MaintainWeight, setMaintainWeight] = React.useState(0);
  const [items, setItems] = useState([
    {label: 'Male', value: 'male'},
    {label: 'Female', value: 'female'},
  ]);
  const [calData, setCaldata] = React.useState([])

  const calorieCounterFunc = () => {
    const calorieUrl = "https://fitness-calculator.p.rapidapi.com/dailycalorie"
    axios({
      method: 'get',
      url: calorieUrl,
      params: {
        age: age.toString(),
        gender: gender,
        height: height.toString(),
        weight: weight.toString(),
        activitylevel: 'level_1'
      },
      headers: {
        'X-RapidAPI-Key': '5cd3250e74msh2fe99043d4e8234p10d6fdjsn52522327a998',
        'X-RapidAPI-Host': 'fitness-calculator.p.rapidapi.com'
      }
    }).then((response) => {
      let res = response.data.data.goals;
      setMaintainWeight(res["maintain weight"])
      delete res["maintain weight"]
      console.log(res)
      var calorieData = Object.keys(res).map(key => {

          res[key].title = key;
          if (res[key]['gain weight']){
            res[key][ 'weight' ] = res[key]['gain weight'];
          delete res[key]['gain weight'];
          }else{
            res[key][ 'weight' ] = res[key]['loss weight'];
          delete res[key]['loss weight'];
          }
          
          return res[key];
      })
      calorieData.sort((a,b) => a.calory - b.calory)
      console.log("Cal",calorieData)
      setCaldata(calorieData)
    });
  }

  return (
    <SafeAreaView style={styles.calorieScreen}>
      <View style={styles.middle}>
        <Text style={styles.calorieText}>How much should you eat?</Text>
      </View>
      <View style={{marginHorizontal: 10, zIndex: 1,}}>
        <View >
        <View style={styles.entries}>
          <Text style={styles.textBold}>Age: </Text>
          <View style={styles.inputWrapper}>
                <TextInput
            style={styles.input}
            onChangeText={onChangeAge}
            placeholder="eg:23"
            keyboardType="numeric"
            value={age}
          />
          </View>
      
        </View>
      </View>
      <View >
        <View style={styles.entries}>
          <Text style={styles.textBold}>Height: </Text>
          <View style={styles.inputWrapper}>
            <TextInput
            style={styles.input}
            onChangeText={onChangeHeight}
            placeholder="eg:171 (in cm)"
            keyboardType="numeric"
            value={height}
          /></View>
        </View>
      </View>
      <View style={{zIndex: 1,}}>
        <View style={styles.entries}>
          <Text style={styles.textBold}>Gender: </Text>
          <View style={{paddingLeft: 10,marginRight: 195, zIndex: 1,}}>
            <DropDownPicker
            open={open}
            value={gender}
            items={items}
            setOpen={setOpen}
            setValue={onChangeGender}
            setItems={setItems}
            theme="LIGHT"
            multiple={false}
            dropDownStyle={{backgroundColor: "#fff",}}
            mode="BADGE"
            badgeDotColors={["#e76f51", "#00b4d8", "#e9c46a", "#e76f51", "#8ac926", "#00b4d8", "#e9c46a"]}
          />
        </View>
          </View>
   
      </View>
      <View >
        <View style={styles.entries}>
          <Text style={styles.textBold}>Weight: </Text>
          <View style={styles.inputWrapper}>
            <TextInput
            style={styles.input}
            onChangeText={onChangeWeight}
            placeholder="eg:70 (in kgs)"
            keyboardType="numeric"
            value={weight}
          />
          </View>

        </View>
      </View>
      </View>
      
      <TouchableOpacity
        style={styles.butto11}
        onPress={calorieCounterFunc}
      ><Text style = {styles.appButtonText}>Calculate</Text>
      </TouchableOpacity>
        
      <FlatList
        data={calData}
        renderItem={CaloriDisplay}
        keyExtractor={item => item.calory}
        persistentScrollbar={true}
      />
    </SafeAreaView>

  );
}

const CaloriDisplay = ({item}) => (
      <View style={{flex: 1}}>
        <View style={{marginHorizontal: 20, alignItems: 'center', padding: 10,}}>
          <Text style={styles.captionDisplay}>{item.title} ({item.weight})</Text>
          <Text style={styles.status}>Daily calorie intake: {item.calory}</Text>
        </View>
      </View>     
    )

const styles = StyleSheet.create({
  // const styles = EStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    backgroundColor: "#fccdb6"
  },
  panelBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '86%',
    // borderWidth: 1,
    // borderColor: 'gray',
    // borderRadius: 4,
    borderBottomColor: 'black',
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 0,
  },
  searchInput:{
    width: "75%",
    //  borderBottomColor: '#000000',
    paddingBottom: 20,
    // alignSelf: "flex-start",
    // fontSize: 15,
    // placeholderTextColor: "white"
    // height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: "#000000",
    borderBottomWidth: 1.5,
  },
  searchButton: {
    // marginBottom: 30,
    width: 88,
    alignItems: 'center',
    // backgroundColor: '#2196F3'
    backgroundColor: "#F49262",
    borderRadius: 15
  },
  searchButtonText: {
    textAlign: 'center',
    padding: 13,
    color: 'white',
    fontSize: 18
  },
  text:{
    flex: 6,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 0,
  },poster:{
    justifyContent: 'center',
    alignItems: 'center',
    flex: 4,
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 0,
  },
  captionDisplay:{
    color: '#F75A0D',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 3,
    marginVertical: 8,
    marginHorizontal: 5, 
  },
  status:{ 
    color: '#90593E',
    fontSize: 20,
    padding: 3,
    // marginVertical: 0,
    marginHorizontal: 5, 
  },
  hide:{
    color:'#5588c1',
    fontSize: 14,
    padding: 3,
    marginVertical: 0,
    marginHorizontal: 5,
  },
  image:{
    width: '90%',
    height: undefined,
    aspectRatio: 1.3,
  },
  panelAdd:{
    flexDirection:"row",
    justifyContent: 'flex-start',
    color: 'gray',
    width: '80%',
    marginTop: 5,
    marginBottom: 5,
  },
  header:{
    fontSize: 20,
    fontWeight: 'bold',
    fontolor: '#1b00fa'
  },
  panelBody2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '62%',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 0,
    marginLeft:44
  },
  footer:{
    alignContent: 'center',
    justifyContent: 'center',
    marginLeft:85
  },
  homescreen:{ 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    // backgroundColor: "#fccdb6"
  },
  homeImage:{
    width: '100%',
    height: undefined,
    aspectRatio: 3.6,
    // borderRadius: 5,
    overflow: "hidden",
    marginHorizontal:35,
    // borderWidth: 3,
    // borderColor: "blue"
  },
  homeposter:{
    // justifyContent: 'center',
    // alignItems: 'center',
    // flex: 1,
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 50,
    marginBottom: 60,
    marginTop: 50,
    overflow: 'hidden'
  },
  welcome: {
    marginTop: 100,
    fontSize: 60,
    fontWeight: 'bold',
    fontFamily: "Savoye LET"
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  butto11: {
    // alignItems: "center",
    // backgroundColor: "#007AFF",
    // padding: 5,
    // fontSize:500,
    margin:25,
    elevation: 8,
    backgroundColor: "#444444",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 35,
    marginHorizontal: 110,
  },
    buttonHome: {
    // alignItems: "center",
    // backgroundColor: "#007AFF",
    // padding: 5,
    // fontSize:500,
    margin:25,
    elevation: 8,
    backgroundColor: "#444444",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginHorizontal: 20,
  },

  appButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase"
  },
  calorieScreen:{
    flex: 1,
    // justifyContent: "space-between",
    // justifyContent:"center",
    // alignItems: 'center',
    backgroundColor: "#fccdb6",
    // padding: 50,
    // margin: 10,
    // marginHorizontal: 0,
  },
  middle: {
    // flex: 0.3,
    backgroundColor: "#F49262",
    // borderWidth: 2,
    
    borderRadius:40,
    // borderStyle:'dashed',
    // marginTop: 50,
    justifyContent:"center",
    alignItems: 'center',
    width: "90%", height: 50,
    // marginHorizontal: 60,
    // marginTop: 20,
    margin: 20,
    paddingHorizontal: 20,
    // marginVertical: 30
    // shadowColor: 'black',
    // elevation: 0.6,
    // shadowRadius: 4,
    // shadowOffset: {width: 10, height: 10,}
  },
  calorieText: {
    fontSize: 20,
    color: "#FDFAF9",
    fontWeight: "bold",
    alignSelf: "center",
    // textTransform: "uppercase"
  },
  textBold: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 80,
    color:'#79452B',

  },
  entries:{
    // borderColor: 'black',
    // borderWidth: 2,
    // justifyContent: "space-between",
    // flex: 1,
    zIndex: 1,
    flexDirection: 'row',
    // width: "50%",
    paddingHorizontal: 10,
    textAlign: "left",
    display: 'flex',
    justifyContent: "space-between",
    alignItems: "center"
  },
  input: {
    fontSize: 18,

    // margin: 12,
    // borderWidth: 1,
    // padding: 10,
  },
  inputWrapper:{
    width: "75%",
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  video: {
    alignSelf: 'center',
    width: 320,
    height: 200,
  },
  card: {
    // padding: 20,
    // backgroundColor: "#fff",
    // margin: 10,

    backgroundColor: "grey",
    margin: 10,
    marginHorizontal: 10,
    // shadowOpacity: 0.5,
    // shadowColor: "#ccc",
    // shadowOffset: { height: 4, width: 4 },
    // marginHorizontal: 20,
    // // alignSelf:"left"
    // justifyContent:"center"
  },
  map: {
    borderWidth: 2,
    width: 70,
    alignSelf: "left",
    height: 50,
    marginBottom: 15,
  },
  foodImage:{
    width: '90%',
    height: undefined,
    aspectRatio: 1.3,
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    alignItems: "center",
  },
  CitysubHeader: {
    marginTop: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 12,
  },
  subHeaderText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  priceLow: {
    fontWeight: "bold",
    fontSize: 20,
    color: "red",
  },
  RecipeScreen:{
    flex: 1,
    // justifyContent: "space-between",
    // justifyContent:"center",
    // alignItems: 'center',
    backgroundColor: "#f0eeed",
    // padding: 50,
    // margin: 10,
    // marginHorizontal: 0,
  },
  card1: {
    // padding: 20,
    // backgroundColor: "#fff",
    // margin: 10,

    backgroundColor: "#ecb397",
    margin: 10,
    marginHorizontal: 30,
    shadowOpacity: 0.5,
    shadowColor: "#bdbcbc",
    shadowOffset: { height: 3},
    shadowRadius: 5,
    borderRadius: 5,
    backgroundColor: "white",
    // marginHorizontal: 20,
    // // alignSelf:"left"
    // justifyContent:"center"
  },
  map1: {
    // borderWidth: 2,
    // width: 70,
    // alignSelf: "left",
    // height: 50,
    // marginBottom: 15,
    justifyContent:'center'
  },
  foodImage1:{
    width: '95%',
    // height: '30%',
    marginTop:8,
    alignSelf:"center",
    alignItems:"center",
    justifyContent:"center",
    aspectRatio: 1.9,
    borderColor: 'black',
    borderRadius: 5,
    borderWidth:0
  },
  subHeader1: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    alignItems: "center",
  },
  CitysubHeader1: {
    marginTop: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 12,
  },
  subHeaderText1: {
    fontWeight: "bold",
    fontSize: 16,
  },
  priceLow1: {
    fontWeight: "bold",
    fontSize: 20,
    color: "red",
  },
  header1:{
    fontSize: 20,
    fontWeight: 'bold',
    margin: 10
  },
  containerFoodPanel: {
    flex: 1,
    // backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    backgroundColor: "#ffffff"
  },
  searchBarView: {
    // marginTop: 10,
    flex: 1.5,
    // height: "50%",
    // width: "75%",
    // alignContent: "center",
  },

  searchBar: {
    backgroundColor: "#ffffff",
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent'
  },
  backgroundImage:{
    flex: 1,
    justifyContent: "center"
  }
});