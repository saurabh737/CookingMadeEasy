import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  ImageBackground,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableHighlight,
  Pressable,
} from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DropDownPicker from "react-native-dropdown-picker";
import { Video } from "expo-av";
import { Fontisto } from "@expo/vector-icons";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { SearchBar } from "react-native-elements";

import * as Speech from "expo-speech";
const avatarPlaceholderImg = require("./assets/logo-black.png");

const Stack = createNativeStackNavigator();

const firebaseConfig = {
  apiKey: "AIzaSyBS0hk6gW7PS6pzXEXVttpp8D6oSWk1h-A",
  authDomain: "w11c2-df037.firebaseapp.com",
  projectId: "w11c2-df037",
  storageBucket: "w11c2-df037.appspot.com",
  messagingSenderId: "117919717569",
  appId: "1:117919717569:web:87c842d71587c92ed7dc40",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let foodConstURL = "https://tasty.p.rapidapi.com/recipes/list";

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splashpage">
        <Stack.Screen
          name="Splashpage"
          component={Splashpage}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="All Recipes" component={HomePage} />
        <Stack.Screen name="Calorie Counter" component={CalorieCounter} />
        <Stack.Screen name="Details" component={RecipeInfo} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function RecipeInfo(props) {
  const video = React.useRef(null);
  const propsData = props.route.params.text;
  const [loader, setLoader] = React.useState(true);
  const [status, setStatus] = React.useState(null);
  const [recipeData, setRecipeData] = useState(null);
  const [audioName, setAudioName] = useState(null);

  const saveRecipeData = async (foodObj, recipeId) => {
    await setDoc(doc(db, "recipeInfo", recipeId.toString()), foodObj);
  };
  const [audio, setAudio] = useState(true);

  const getRecipeData = async (recipeId) => {
    try {
      const docRef = doc(db, "recipeInfo", recipeId.toString());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const speak = (type, data, name) => {
    if (audio && audioName == name) {
      Speech.resume();
    } else if (!audio && audioName == name) {
      Speech.pause();
    }

    if (type == "instructions") {
      let text = "";
      data.forEach((ingre, id) => {
        text = text.concat((ingre.id + 1).toString(), ingre.text);
      });
      Speech.speak(text);
    }
  };

  const getRecipeInfo = (recipeId) => {
    const options = {
      method: "GET",
      url: "https://tasty.p.rapidapi.com/recipes/get-more-info",
      params: { id: recipeId },
      headers: {
        "X-RapidAPI-Key": "5cd3250e74msh2fe99043d4e8234p10d6fdjsn52522327a998",
        "X-RapidAPI-Host": "tasty.p.rapidapi.com",
      },
    };

    axios
      .request(options)
      .then(function (response) {
        response = response.data;
        let instrArr = [];
        response.instructions.forEach((instr, id) => {
          instrArr.push({
            id: id,
            text: instr.display_text,
          });
        });
        let ingredients = [];
        response.sections[0].components.forEach((ingre, id) => {
          ingredients.push({
            id: ingre.id,
            text: ingre.raw_text,
          });
        });
        let recipeSavaData = {
          name: response.name,
          serving: `${response.num_servings} people`,
          video: response.original_video_url
            ? response.original_video_url
            : response.video_url,
          instructions: instrArr,
          image: response.thumbnail_url ? response.thumbnail_url : "",
          ingredients: ingredients,
        };
        saveRecipeData(recipeSavaData, recipeId);
        setRecipeData(recipeSavaData);
        setLoader(false);
      })
      .catch(function (error) {
        console.error(error);
      });
  };

  useEffect(() => {
    (async () => {
      let recipeInfo = await getRecipeData(props.route.params.text.id);
      if (recipeInfo) {
        setRecipeData(recipeInfo);
        setLoader(false);
        Speech.stop();
      } else getRecipeInfo(props.route.params.text.id);
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {loader ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#F49262" />
        </View>
      ) : (
        <SafeAreaView style={styles.recipeInfoContainer}>
          {/* <ScrollView style={styles.scrollView}> */}
          <View style={styles.recipeInfoScreen}>
            <View style={styles.recipeTitle}>
              <Text style={styles.recipeTitleText}>{recipeData.name}</Text>
            </View>
            {propsData.user_ratings.count_positive /
              (propsData.user_ratings.count_positive +
                propsData.user_ratings.count_negative) >
            0 ? (
              <View style={styles.recipeLikeRate}>
                <Text style={styles.recipeLikeRateText}>
                  {Math.ceil(
                    (propsData.user_ratings.count_positive /
                      (propsData.user_ratings.count_positive +
                        propsData.user_ratings.count_negative)) *
                      100
                  )}
                  % would make it again
                </Text>
              </View>
            ) : (
              ""
            )}

            <ScrollView style={styles.scrollView}>
              <Video
                ref={video}
                style={styles.video}
                source={{
                  uri: recipeData.video,
                }}
                useNativeControls
                resizeMode="stretch"
                isLooping="false"
                shouldPlay
                onPlaybackStatusUpdate={(status) => setStatus(() => true)}
              />
              <View style={styles.recipeIngredients}>
                <Text style={styles.recipeIngredientsText}>Ingridents</Text>
                <Text style={styles.recipeServingText}>
                  ( for {recipeData.serving} )
                </Text>
                <SafeAreaView style={{ flex: 1 }}>
                  <FlatList
                    data={recipeData.ingredients}
                    renderItem={ingredientsDisplay}
                    keyExtractor={(item) => item.id}
                  />
                </SafeAreaView>
              </View>
              <Pressable
                onPress={() => {
                  setAudio(!audio);
                  speak(
                    "instructions",
                    recipeData.instructions,
                    recipeData.name
                  );
                  setAudioName(recipeData.name);
                  // setAudio(!audio);
                }}
                // style={styles.btnClickContain}
              >
                <View
                  style={{ marginTop: 20, justifyContent: "space-between" }}
                >
                  <Text style={styles.recipeInstructionsText}>
                    {" "}
                    Instructions{"  "}
                    {audio ? (
                      <Fontisto name="volume-up" size={18} color="black" />
                    ) : (
                      <Fontisto name="volume-off" size={18} color="black" />
                    )}
                  </Text>
                </View>
              </Pressable>
              <SafeAreaView style={{ flex: 1, marginBottom: 20 }}>
                <FlatList
                  data={recipeData.instructions}
                  renderItem={InstrDisplay}
                  keyExtractor={(item) => item.id}
                />
              </SafeAreaView>
            </ScrollView>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const InstrDisplay = ({ item }) => (
  <View>
    <View style={styles.instructions}>
      <Text style={styles.instructionsText}>
        {" "}
        {item.id + 1}. {item.text}
      </Text>
    </View>
  </View>
);

const ingredientsDisplay = ({ item }) => (
  <View>
    <View style={styles.ingredients}>
      <Text style={styles.ingredientsText}>{item.text}</Text>
    </View>
  </View>
);

function Splashpage(props) {
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("./assets/Splash_image_try.jpg")}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <View style={styles.homescreen}>
          <View style={styles.logoView}>
            <Image
              style={styles.logoImage}
              source={require("./assets/logo-no-background.png")}
            />
          </View>
          <View style={{ marginVertical: 20, marginBottom: 50 }}>
            <TouchableOpacity
              style={styles.buttonHome}
              onPress={() =>
                props.navigation.navigate("All Recipes", {
                  text: "All Recipes",
                })
              }
            >
              <Text style={styles.appButtonText}>Explore Recipes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonHome}
              onPress={() =>
                props.navigation.navigate("Calorie Counter", {
                  text: "Home Screen",
                })
              }
            >
              <Text style={styles.appButtonText}>Calorie Counter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

function HomePage(props) {
  const [movies, setMovies] = useState([]);
  const [homeLoader, sethomeLoader] = useState(true);
  const [selectIndex, setSelectIndex] = useState(1);

  const saveData = async (foodObj) => {
    await setDoc(doc(db, "food", foodObj.id.toString()), foodObj);
  };

  const getData = async () => {
    const querySnapshot = await getDocs(collection(db, "food"));
    let movieRes = [];
    querySnapshot.forEach((doc) => {
      // console.log(doc.id, '=>', doc.data());
      movieRes.push(doc.data());
    });
    return movieRes;
  };

  const getReviews = async (searchKey) => {
    sethomeLoader(true);
    if (searchKey == "all") {
      let movieArray = await getData();
      if (movieArray.length !== 0) {
        setMovies([...movieArray]);
        sethomeLoader(false);
      }
    } else {
      let foodURL = foodConstURL;
      if (searchKey.length > 0 && searchKey != "all") {
        foodURL = `${foodConstURL}?from=0&size=60&q=${searchKey}`;
      } else {
        foodURL = `${foodConstURL}?from=0&size=300`;
      }
      axios({
        method: "get",
        url: foodURL,
        headers: {
          "X-RapidAPI-Key":
            "5cd3250e74msh2fe99043d4e8234p10d6fdjsn52522327a998",
          "X-RapidAPI-Host": "tasty.p.rapidapi.com",
        },
      }).then((response) => {
        let movieList = response.data.results;
        let movieArray = [];
        movieList.forEach((item, id) => {
          let d = new Date(item.created_at * 1000);
          let instArr = [];
          if (
            item.name &&
            item.thumbnail_url &&
            (item.original_video_url || item.video_url) &&
            item.instructions
          ) {
            item.instructions.forEach((instr, id) => {
              instArr.push(instr.display_text);
            });
            let movieObject = {
              id: item.id,
              key: item.id,
              title: item.name,
              name:
                item.description && item.description.length > 20
                  ? `${item.description.slice(0, 50)}...`
                  : item.description,
              date: `${d.getMonth() + 1}-${d.getDay()}-${d.getFullYear()}`,
              source: item.thumbnail_url ? item.thumbnail_url : "",
              metadata: {
                instructions: instArr,
                user_ratings: item.user_ratings,
                tags: item.tags,
                video_url: item.original_video_url
                  ? item.original_video_url
                  : item.video_url,
                id: item.id,
              },
            };
            if (!(searchKey.length > 0)) {
              saveData(movieObject);
            }
            movieArray.push(movieObject);
          }
        });
        movieArray.sort(
          (a, b) =>
            b.metadata.user_ratings.count_positive -
            a.metadata.user_ratings.count_positive
        );

        setMovies([...movieArray]);
        sethomeLoader(false);
      });
    }
  };

  const [suggestion, setSuggestion] = useState(null);

  function searchSuggestion(text) {
    setSuggestion([
      { id: 1, dText: "Chicken" },
      { id: 2, dText: "Fish" },
    ]);
    console.log(suggestion);
  }

  useEffect(() => {
    (async () => {
      let movieArray = await getData();
      if (movieArray.length !== 0) {
        setMovies([...movieArray]);
        sethomeLoader(false);
      } else {
        getReviews("");
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.containerFoodPanel}>
      <SearchPanel
        searchFunction={getReviews}
        searchSuggestion={searchSuggestion}
      />
      <FlatList
        style={{ marginLeft: 0, width: 400, height: 50 }}
        horizontal={true}
        data={[
          { id: 1, dText: "All Recipes", tag_name: "all" },
          { id: 2, dText: "Indian", tag_name: "indian" },
          { id: 3, dText: "Italian", tag_name: "italian" },
          { id: 4, dText: "Under 30min", tag_name: "under_30_minutes" },
          { id: 5, dText: "Dairy-Free", tag_name: "dairy_free" },
          { id: 6, dText: "Vegan", tag_name: "vegan" },
          { id: 7, dText: "Budget Expert", tag_name: "budget_expert" },
          { id: 8, dText: "Thai", tag_name: "thai" },
          { id: 9, dText: "Mexican", tag_name: "mexican" },
          { id: 10, dText: "Dessert", tag_name: "one_top_app_dessert" },
        ]}
        renderItem={(item) =>
          tags(item, getReviews, selectIndex, setSelectIndex)
        }
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
      />
      {/* </View> */}
      {homeLoader ? (
        <View style={{ flex: 1, marginTop: 20 }}>
          <ActivityIndicator size="large" color="#F49262" />
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={(item) => foodPanel(item, props)}
          keyExtractor={(item) => item.id}
          ListFooterComponent={Footer}
        />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const tags = ({ item }, getReviews, selectIndex, setSelectIndex) => {
  return (
    <View
      style={[
        styles.tagButton,
        {
          backgroundColor: selectIndex === item.id ? "#F28585" : "transparent",
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss();
          getReviews(item.tag_name);
          setSelectIndex(item.id);
        }}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.tagButtonText,
            {
              color: selectIndex === item.id ? "black" : "grey",
            },
          ]}
        >
          {item.dText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

function SearchPanel(props) {
  const [text, setText] = useState("");

  return (
    <View>
      <View style={styles.panelBody}>
        <View style={styles.searchBarView}>
          <SearchBar
            Color="#ffff"
            containerStyle={styles.searchBar}
            placeholder="Looking for..."
            lightTheme
            round
            searchIcon={{ color: "#fff", solid: true, size: 35 }}
            inputStyle={{ color: "#fff" }}
            onChangeText={(value) => {
              setText(value);
              props.searchSuggestion(value);
            }}
            onSubmitEditing={() => {
              props.searchFunction(text);
            }}
            showCancel
            value={text}
          />
        </View>
      </View>
    </View>
  );
}

const foodPanel = ({ item }, props, saveData, getData) => (
  <View style={styles.card1}>
    <View style={styles.map1}>
      <Image
        resizeMode="cover"
        defaultSource={avatarPlaceholderImg}
        style={styles.foodImage1}
        source={{ uri: item.source }}
      />
    </View>
    <View style={styles.header1}>
      <View style={styles.subHeader1}>
        <Text style={styles.subHeaderText1}>{item.title}</Text>
      </View>
      <Text style={styles.priceHigh1}>
        <Fontisto name="like" size={18} color="green" />
        {"  "}
        {item.metadata.user_ratings.count_positive}
        {"      "}
        <Fontisto name="dislike" size={18} color="red" />
        {"  "}
        {item.metadata.user_ratings.count_negative}
      </Text>
      <Guide id={item.id} propsData={props} metadata={item.metadata} />
    </View>
  </View>
);
function Footer(props) {
  return (
    <TouchableOpacity style={styles.footer}>
      <Text style={styles.status} onPress={props.clickFunction}>
        more
      </Text>
    </TouchableOpacity>
  );
}

function Guide(props) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <TouchableOpacity>
        <View style={styles.recipeViewButton}>
          <Text
            style={styles.recipeViewText}
            onPress={() => {
              props.propsData.navigation.navigate("Details", {
                text: props.metadata,
              });
            }}
          >
            Step-by-Step Guide
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function CalorieCounter(props) {
  const [age, onChangeAge] = React.useState(null);
  const [height, onChangeHeight] = React.useState(null);
  const [gender, onChangeGender] = React.useState(null);
  const [open, setOpen] = useState(false);
  const [weight, onChangeWeight] = React.useState(null);
  const [MaintainWeight, setMaintainWeight] = React.useState(0);
  const [items, setItems] = useState([
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ]);
  const [calData, setCaldata] = React.useState([]);

  const calorieCounterFunc = () => {
    const calorieUrl = "https://fitness-calculator.p.rapidapi.com/dailycalorie";
    axios({
      method: "get",
      url: calorieUrl,
      params: {
        age: age.toString(),
        gender: gender,
        height: height.toString(),
        weight: weight.toString(),
        activitylevel: "level_1",
      },
      headers: {
        "X-RapidAPI-Key": "5cd3250e74msh2fe99043d4e8234p10d6fdjsn52522327a998",
        "X-RapidAPI-Host": "fitness-calculator.p.rapidapi.com",
      },
    }).then((response) => {
      let res = response.data.data.goals;
      setMaintainWeight(res["maintain weight"]);
      delete res["maintain weight"];
      var calorieData = Object.keys(res).map((key) => {
        res[key].title = key;
        if (res[key]["gain weight"]) {
          res[key]["weight"] = res[key]["gain weight"];
          delete res[key]["gain weight"];
        } else {
          res[key]["weight"] = res[key]["loss weight"];
          delete res[key]["loss weight"];
        }

        return res[key];
      });
      calorieData.sort((a, b) => a.calory - b.calory);
      setCaldata(calorieData);
    });
  };

  return (
    <SafeAreaView style={styles.calorieScreen}>
      <View style={styles.middle}>
        <Text style={styles.calorieText}>How much should you eat?</Text>
      </View>
      <View style={{ marginHorizontal: 10, zIndex: 1 }}>
        <View>
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
        <View>
          <View style={styles.entries}>
            <Text style={styles.textBold}>Height: </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                onChangeText={onChangeHeight}
                placeholder="eg:171 (in cm)"
                keyboardType="numeric"
                value={height}
              />
            </View>
          </View>
        </View>
        <View style={{ zIndex: 1 }}>
          <View style={styles.entries}>
            <Text style={styles.textBold}>Gender: </Text>
            <View
              style={{
                paddingLeft: 10,
                marginRight: 195,
                zIndex: 1,
                borderRadius: 30,
              }}
            >
              <DropDownPicker
                open={open}
                value={gender}
                items={items}
                setOpen={setOpen}
                setValue={onChangeGender}
                setItems={setItems}
                theme="LIGHT"
                multiple={false}
                showTickIcon={true}
                dropDownStyle={{ backgroundColor: "#fff", borderWidth: 30 }}
                containerStyle={{ borderWidth: 0 }}
                mode="BADGE"
                badgeDotColors={[
                  "#e76f51",
                  "#00b4d8",
                  "#e9c46a",
                  "#e76f51",
                  "#8ac926",
                  "#00b4d8",
                  "#e9c46a",
                ]}
              />
            </View>
          </View>
        </View>
        <View>
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
        onPress={() => {
          Keyboard.dismiss();
          calorieCounterFunc();
        }}
      >
        <Text style={styles.appButtonText}>Calculate</Text>
      </TouchableOpacity>

      <FlatList
        data={calData}
        renderItem={CaloriDisplay}
        keyExtractor={(item) => item.calory}
        persistentScrollbar={true}
      />
    </SafeAreaView>
  );
}

const CaloriDisplay = ({ item }) => (
  <View style={{ flex: 1 }}>
    <View style={{ marginHorizontal: 20, alignItems: "center", padding: 10 }}>
      <Text style={styles.captionDisplay}>
        {item.title} ({item.weight})
      </Text>
      <Text style={styles.status}>Daily calorie intake: {item.calory}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 30,
    backgroundColor: "#fccdb6",
  },
  panelBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // width: "86%",
    borderBottomColor: "black",
    paddingTop: 3,
    marginLeft: 20,
    marginRight: 30,
  },
  searchInput: {
    width: "75%",
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#000000",
    borderBottomWidth: 1.5,
  },
  searchButton: {
    width: 88,
    alignItems: "center",
    backgroundColor: "#F49262",
    borderRadius: 15,
  },
  searchButtonText: {
    textAlign: "center",
    padding: 13,
    color: "white",
    fontSize: 18,
  },
  text: {
    flex: 6,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexWrap: "wrap",
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 0,
  },
  poster: {
    justifyContent: "center",
    alignItems: "center",
    flex: 4,
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 0,
  },
  captionDisplay: {
    color: "#F75A0D",
    fontSize: 20,
    fontWeight: "bold",
    padding: 3,
    marginVertical: 8,
    marginHorizontal: 5,
  },
  status: {
    color: "#90593E",
    fontSize: 20,
    padding: 3,
    marginHorizontal: 5,
  },
  hide: {
    color: "#5588c1",
    fontSize: 20,
    marginTop: 10,
    marginVertical: 0,
    marginHorizontal: 5,
  },
  image: {
    width: "90%",
    height: undefined,
    aspectRatio: 1.3,
  },
  panelAdd: {
    flexDirection: "row",
    justifyContent: "flex-start",
    color: "gray",
    width: "80%",
    marginTop: 5,
    marginBottom: 5,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    fontolor: "#1b00fa",
  },
  panelBody2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "62%",
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    padding: 3,
    marginVertical: 5,
    marginHorizontal: 0,
    marginLeft: 44,
  },
  footer: {
    alignContent: "center",
    justifyContent: "center",
    marginLeft: 85,
  },
  homescreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 3.6,
    overflow: "hidden",
    marginHorizontal: 35,
  },
  logoView: {
    padding: 3,
    paddingBottom: 130,
    marginVertical: 15,
    marginHorizontal: 50,
    // marginTop: 50,
    overflow: "hidden",
  },
  welcome: {
    marginTop: 100,
    fontSize: 60,
    fontWeight: "bold",
    fontFamily: "Savoye LET",
  },
  fixToText: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  butto11: {
    margin: 25,
    elevation: 8,
    backgroundColor: "#444444",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 35,
    marginHorizontal: 110,
  },
  buttonHome: {
    margin: 8,
    elevation: 8,
    backgroundColor: "#943100",
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginHorizontal: 30,
  },

  appButtonText: {
    fontSize: 25,
    color: "#fff",
    fontWeight: "500",
    alignSelf: "center",
    // textTransform: "uppercase",
  },
  calorieScreen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  middle: {
    backgroundColor: "#F49262",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
    height: 50,
    margin: 20,
    paddingHorizontal: 20,
  },
  calorieText: {
    fontSize: 20,
    color: "#FDFAF9",
    fontWeight: "bold",
    alignSelf: "center",
  },
  textBold: {
    fontSize: 18,
    fontWeight: "bold",
    width: 80,
    color: "#79452B",
  },
  entries: {
    zIndex: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    fontSize: 18,
  },
  inputWrapper: {
    width: "75%",
    margin: 12,
    // borderWidth: 1,
    padding: 10,
    shadowOpacity: 0.5,
    shadowColor: "#bdbcbc",
    shadowOffset: { height: 3 },
    shadowRadius: 5,
    borderRadius: 5,
    backgroundColor: "white",
  },
  backgroundVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  card: {
    backgroundColor: "grey",
    margin: 10,
    marginHorizontal: 10,
  },
  map: {
    borderWidth: 2,
    width: 70,
    alignSelf: "left",
    height: 50,
    marginBottom: 15,
  },
  foodImage: {
    width: "90%",
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
  RecipeScreen: {
    flex: 1,
    backgroundColor: "#f0eeed",
  },
  card1: {
    backgroundColor: "#ecb397",
    // margin: 10,
    marginVertical: 10,
    marginHorizontal: 30,
    shadowOpacity: 0.5,
    shadowColor: "#bdbcbc",
    shadowOffset: { height: 3 },
    shadowRadius: 5,
    borderRadius: 5,
    backgroundColor: "white",
    // width: "100%",
    // alignSelf: "center",
  },
  map1: {
    justifyContent: "center",
  },
  foodImage1: {
    width: "95%",
    // height: undefined,
    marginTop: 8,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1.9,
    borderColor: "black",
    borderRadius: 5,
    borderWidth: 0,
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
  header1: {
    fontSize: 20,
    fontWeight: "bold",
    margin: 10,
  },
  containerFoodPanel: {
    flex: 1,
    // alignItems: "center",
    // justifyContent: "center",
    paddingTop: 30,
    backgroundColor: "#ffffff",
  },
  searchBarView: {
    flex: 1.5,
  },

  searchBar: {
    backgroundColor: "#ffffff",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
  },
  backgroundImage: {
    flex: 1,
    // opacity: 0.,
    justifyContent: "center",
  },
  recipeViewButton: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    marginTop: 10,
  },
  recipeViewText: {
    textAlign: "center",
    padding: 13,
    color: "#79452B",
    fontSize: 18,
  },
  controlBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  recipeInfoContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  recipeInfoScreen: {
    flex: 1,
  },
  recipeTitle: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingLeft: 10,
    marginTop: 10,
  },
  recipeTitleText: {
    fontSize: 29,
    fontWeight: "700",
    color: "black",
    fontFamily: "GillSans-Bold",
  },
  recipeLikeRate: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingLeft: 10,
  },
  recipeLikeRateText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e40754",
    fontFamily: "GillSans-BoldItalic",
  },
  video: {
    alignSelf: "center",
    marginTop: 10,
    width: "99%",
    height: 250,
    borderColor: "grey",
    // borderWidth: 1,
    borderRadius: 10,
  },
  recipeIngredients: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingLeft: 10,
  },
  recipeIngredientsText: {
    marginTop: 5,
    fontSize: 28,
    fontWeight: "900",
    color: "#222",
    fontFamily: "TimesNewRomanPS-BoldMT",
  },
  recipeServingText: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
    fontFamily: "TimesNewRomanPS-BoldMT",
  },
  ingredients: {
    shadowOpacity: 0.5,
    shadowColor: "#bdbcbc",
    shadowOffset: { height: 3 },
    shadowRadius: 5,
    borderRadius: 5,
  },
  ingredientsText: {
    marginTop: 7,
    fontSize: 21,
    marginHorizontal: 15,
    // fontWeight: '900',
    color: "#222",
    fontFamily: "Times New Roman",
  },
  recipeInstructionsText: {
    marginTop: 5,
    fontSize: 28,
    fontWeight: "900",
    color: "#222",
    fontFamily: "TimesNewRomanPS-BoldMT",
  },
  instructions: {
    margin: 5,
  },
  instructionsText: {
    marginTop: 5,
    fontSize: 21,
    marginHorizontal: 15,
    // fontWeight: '900',
    color: "#222",
    fontFamily: "Times New Roman",
  },
  overlay: {
    flex: 1,
    position: "absolute",
    left: 20,
    top: 60,
    opacity: 1,
    backgroundColor: "white",
    borderRadius: 10,
    width: 390,
  },
  tagButton: {
    // width: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    borderColor: "black",
    // borderWidth: 0.8,
    // borderLeftWidth: 1.2,
    // borderRightWidth: 1.2,
    margin: 5,
    // flexGrow: 0,
    paddingHorizontal: 15,
    height: 35,
  },
  tagButtonText: {
    textAlign: "center",
    // padding: 10,
    color: "black",
    fontSize: 18,
    fontWeight: "350",
  },
  tagtouch: {
    marginLeft: 0,
    width: 400,
    height: 10,
  },
});
