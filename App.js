import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput, FlatList, Button, SafeAreaView } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DropDownPicker from 'react-native-dropdown-picker';

const Stack = createNativeStackNavigator();

let foodConstURL = "https://tasty.p.rapidapi.com/recipes/list"

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splashpage">
        <Stack.Screen name="Splashpage" component={Splashpage} options={{headerShown: false}}/>
        <Stack.Screen name="All Recipes" component={HomePage} />
        <Stack.Screen name="Calorie Counter" component={CalorieCounter} />
        <Stack.Screen name="sss" component={RecipeInfo} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function RecipeInfo(props){

}

function Splashpage(props) {
  return (
    <View style={styles.homescreen}>
      <Text style={styles.welcome} onPress={props.clickFunction}>Cooking Made Easy</Text>
      <View style={styles.homeposter}>
      <Image style={styles.homeImage} source={require('./spalash.png')}/>
    </View>
      <TouchableOpacity
        style={styles.butto11}
        onPress={()=>props.navigation.navigate('All Recipes', { text: "All Recipes" })}
      >
        <Text style = {styles.appButtonText}>Explore Recipes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.butto11}
        onPress={()=>props.navigation.navigate('Calorie Counter', { text: "Home Screen" })}
      >
        <Text style = {styles.appButtonText}>Calorie Counter</Text>
      </TouchableOpacity>
      
      {props.route.params && (
        <Text>Information from {props.route.params.text}!</Text>
      )}
    </View>
  );
}

function HomePage(props) {
  const [movies, setMovies] = useState([])

  const getReviews = (searchKey) => {
    let foodURL = foodConstURL;
    if (searchKey.length > 0){
      foodURL = `${foodConstURL}?from=0&size=20&q=${searchKey}`
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

      movieList.forEach((item, id)=>{
        let d = new Date(item.created_at*1000);
        let movieObject = {
          id:item.id,
          key:item.id,
          title:item.name,
          name: (item.description && item.description.length > 20) ? `${item.description.slice(0, 50)}...`: item.description,
          date:`${d.getMonth()+1}-${d.getDay()}-${d.getFullYear()}`,
          source:item.thumbnail_url?item.thumbnail_url:"",
        }

        console.log(item.name, item.id)
        movieArray.push(movieObject)
      })
      setMovies([...movieArray])
});
  }

  useEffect(()=>{

    getReviews("")

  },[])

  return (
    <SafeAreaView style={styles.container}>
      {/* <Text style={styles.header}>Delicious Recipes</Text> */}
      <SearchPanel searchFunction={getReviews}/>
      <FlatList
        data={movies}
        renderItem={(item) => MoviePanel(item, props)}
        keyExtractor={item => item.id}
        ListFooterComponent = {Footer}
        ListFooterComponentStyle={styles.footer}
      />
      
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function SearchPanel(props){
  const [text, setText] = useState("")

  return(
      <View style={styles.panelBody}>              
        <TextInput
          placeholder="Enter Ingredient name"
          onChangeText={(value)=>setText(value)}
          value={text}
        />
        <Button 
          title="Search"
          onPress={()=>{
            props.searchFunction(text)
            setText("")}
          }/>
      </View>     
    )
}

const MoviePanel = ({item}, props) => (
      <View style={styles.panelBody2}>
        <View style={styles.text}>
          <Title title={item.title}/>
          <Author name={item.name}/>
          <PubDate date={item.date}/>
          <Guide id={item.id} getMoreInfo={getMoreInfo} propsData = {props}/>
        </View>
        <Poster source={item.source}/>
      </View>     
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


const getMoreInfo = (recipeId, propsData) => {
  const [data, setData] = useState({})
  console.log("Hello=================1212121212========")
  const options = {
    method: 'GET',
    url: 'https://tasty.p.rapidapi.com/recipes/get-more-info',
    params: {id: recipeId},
    headers: {
      'X-RapidAPI-Key': '5cd3250e74msh2fe99043d4e8234p10d6fdjsn52522327a998',
      'X-RapidAPI-Host': 'tasty.p.rapidapi.com'
    }
  };

  axios.request(options).then(function (response) {
    // console.log(response.data);
    // propsData.navigation.navigate('Calorie Counter', { text: "Home Screen" })
      
    // {propsData.route.params && (
    //   <Text>Information from ajsdfajsdfj!</Text>
    // )}
    console.log(response.data.id)
  }).catch(function (error) {
    console.error(error);
  });
}

function Guide(props){
  const [data, setData] = useState({})

  console.log("Hello=========================", props.id, props.propsData)
  return(
    <TouchableOpacity 
      //  onPress={props.getMoreInfo(props.id)}
    >
     <Text style={styles.hide} onPress={()=>{getMoreInfo(props.id)
    //   props.propsData.navigation.navigate('Calorie Counter', { text: "Home Screen" })
      
    // {props.propsData.route.params && (
    //   <Text>Information from ajsdfajsdfj!</Text>
    // )}
    }} >Step-by-Step Guide</Text>
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
      // <a  href="#" style={styles.status} id={props.aId} onClick={props.clickFunction}>{props.aCaption}</a>
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
      var calorieData = Object.keys(res).map(key => {
          res[key].title = key;
          if (res['gain weight']){
            res[ 'weight' ] = res[ 'gain weight' ];
          delete res[ 'gain weight' ];
          }else{
            res[ 'weight' ] = res[ 'loss weight' ];
          delete res[ 'loss weight' ];
          }
          return res[key];
      })
      calorieData.sort((a,b) => a.calory - b.calory)
      console.log(calorieData)
      setCaldata(calorieData)
    });
  }

  return (
    <SafeAreaView style={styles.calorieScreen}>
      <View style={styles.middle}>
        <Text style={styles.calorieText}>How much should you eat?</Text>
      </View>
      <View >
        <View style={styles.entries}>
          <Text>Age: </Text>
          <TextInput
            style={styles.input}
            onChangeText={onChangeAge}
            placeholder="eg:23"
            keyboardType="numeric"
            value={age}
          />
        </View>
      </View>
      <View >
        <View style={styles.entries}>
          <Text>Height: </Text>
          <TextInput
            style={styles.input}
            onChangeText={onChangeHeight}
            placeholder="eg:171 (in cm)"
            keyboardType="numeric"
            value={height}
          />
        </View>
      </View>
      <View >
        <View style={styles.entries}>
          <Text>Gender: </Text>
          {/* <TextInput
            style={styles.input}
            onChangeText={onChangeGender}
            value={gender}
            placeholder={'eg: 23'}
          /> */}
           <DropDownPicker
            open={open}
            value={gender}
            items={items}
            setOpen={setOpen}
            setValue={onChangeGender}
            setItems={setItems}

            theme="LIGHT"
            multiple={false}
            mode="BADGE"
            badgeDotColors={["#e76f51", "#00b4d8", "#e9c46a", "#e76f51", "#8ac926", "#00b4d8", "#e9c46a"]}
          />
        </View>
      </View>
      <View >
        <View style={styles.entries}>
          <Text>Weight: </Text>
          <TextInput
            style={styles.input}
            onChangeText={onChangeWeight}
            placeholder="eg:70 (in kgs)"
            keyboardType="numeric"
            value={weight}
          />
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
      />
    </SafeAreaView>

  );
}

const CaloriDisplay = ({item}) => (
      <View >
        <View >
          <Title title={item.title}/>
          <Author name={item.calory}/>
          <PubDate date={item.weight}/>
        </View>
      </View>     
    )

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    backgroundColor: "#fccdb6"
  },panelBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 0,
  },text:{
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
  },captionDisplay:{
    color: '#2F83D0',
    fontSize: 18,
    padding: 3,
    marginVertical: 10,
    marginHorizontal: 5, 
  },status:{ 
    color: 'gray',
    fontSize: 16,
    padding: 3,
    marginVertical: 0,
    marginHorizontal: 5, 
  },hide:{
    color:'#5588c1',
    fontSize: 14,
    padding: 3,
    marginVertical: 0,
    marginHorizontal: 5,
  },image:{
    width: '90%',
    height: undefined,
    aspectRatio: 1.3,
  },panelAdd:{
    flexDirection:"row",
    justifyContent: 'flex-start',
    color: 'gray',
    width: '80%',
    marginTop: 5,
    marginBottom: 5,
  },header:{
    fontSize: 20,
    fontWeight: 'bold',
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
    // justifyContent: 'center',
    backgroundColor: "#fccdb6"
  },
  homeImage:{
    width: '80%',
    height: undefined,
    aspectRatio: 1.3,
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "blue"
  },
  homeposter:{
    // justifyContent: 'center',
    // alignItems: 'center',
    // flex: 1,
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 0,
    marginBottom: 50,
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
    paddingHorizontal: 50
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
    justifyContent:"center",
    alignItems: 'center',
    backgroundColor: "#fccdb6",
    padding: 50,
    // margin: 10,
  },
  middle: {
    // flex: 0.3,
    backgroundColor: "grey",
    borderWidth: 2,
    borderRadius:40,
    borderStyle:'dashed',
    // marginTop: 50,
    justifyContent:"center",
    alignItems: 'center',
    alignContent: 'center',
    width: 200, height: 50,
    marginHorizontal: 100,
    // marginVertical: 30
  },
  calorieText: {
    fontSize: 14,
    color: "blue",
    fontWeight: "bold",
    alignSelf: "center",
    // textTransform: "uppercase"
  },
  entries:{
    // justifyContent: "space-between",
    // flex: 1,
    flexDirection: 'row',
    // width: "50%",
    textAlign: "left",
    display: 'flex',
    justifyContent: "space-between",
    alignItems: "center"
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});