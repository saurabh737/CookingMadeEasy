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
  Pressable,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
import RNPickerSelect, { defaultStyles } from "react-native-picker-select";

const firebaseConfig = {
  apiKey: "AIzaSyBS0hk6gW7PS6pzXEXVttpp8D6oSWk1h-A",
  authDomain: "w11c2-df037.firebaseapp.com",
  projectId: "w11c2-df037",
  storageBucket: "w11c2-df037.appspot.com",
  messagingSenderId: "117919717569",
  appId: "1:117919717569:web:87c842d71587c92ed7dc40",
};

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
  const [search, setSearch] = useState(null);

  const saveData = async (foodObj) => {
    await setDoc(doc(db, "food", foodObj.id.toString()), foodObj);
  };

  const getData = async () => {
    const querySnapshot = await getDocs(collection(db, "food"));
    let movieRes = [];
    querySnapshot.forEach((doc) => {
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
        setSearch(true);
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
        style={{ marginLeft: 0, width: 400, height: 45 }}
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
      {homeLoader ? (
        <View style={{ flex: 1, marginTop: 20 }}>
          <ActivityIndicator size="large" color="#F49262" />
        </View>
      ) : (
        // <View style={{ flex: 250 }}>
        //   <FlatList
        //     data={movies}
        //     renderItem={(item) => foodPanel(item, props)}
        //     keyExtractor={(item) => item.id}
        //     // ListFooterComponent={Footer}
        //   />
        // </View>
        <CardDisplay
          movies={movies}
          search={search}
          propsData={props}
          getReviews={getReviews}
          setSearch={setSearch}
          setSelectIndex={setSelectIndex}
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

function CardDisplay(props) {
  console.log(props.search, props.movies.length);
  return (
    <View style={{ flex: 250 }}>
      {props.search && props.movies.length == 0 ? (
        Alert.alert("Sorry", "No recipes found.", [
          {
            text: "OK",
            onPress: () => {
              props.setSearch(null);
              props.getReviews("all");
              props.setSelectIndex(1);
            },
          },
        ])
      ) : (
        <FlatList
          data={props.movies}
          renderItem={(item) => foodPanel(item, props.propsData)}
          keyExtractor={(item) => item.id}
          // ListFooterComponent={Footer}
        />
      )}
    </View>
  );
}

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
              setText("");
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
  <View style={styles.recipeCardView}>
    <View style={styles.recipeImageView}>
      <Image
        resizeMode="cover"
        defaultSource={avatarPlaceholderImg}
        style={styles.recipeCardImage}
        source={{ uri: item.source }}
      />
    </View>
    <View style={styles.recipecardinfoview}>
      <View style={styles.recipeCardTitleView}>
        <Text style={styles.recipeCardTitleText}>{item.title}</Text>
      </View>
      <Text style={{ fontSize: 17 }}>
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
                }}
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
  const placeholder = {
    label: "Select a gender...",
    value: null,
    color: "#9EA0A4",
  };
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorHeader, setErrorHeader] = useState(null);

  const calorieCounterFunc = () => {
    if (!age || !gender || !height || height < 100 || !weight || weight < 20) {
      if (age == null) {
        setErrorMessage("Please enter a valid age.");
        setErrorHeader("Invalid Age");
      } else if (height == null || height <= 100) {
        setErrorMessage("Please enter a valid Height");
        setErrorHeader("Invalid Height");
      } else if (gender == null) {
        setErrorMessage("Please select gender.");
        setErrorHeader("Invalid Gender");
      } else if (weight == null || weight <= 20) {
        setErrorMessage("Please enter a valid Weight");
        setErrorHeader("Invalid Weight");
      }
      setError(true);
    } else {
      const calorieUrl =
        "https://fitness-calculator.p.rapidapi.com/dailycalorie";
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
          "X-RapidAPI-Key":
            "5cd3250e74msh2fe99043d4e8234p10d6fdjsn52522327a998",
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
    }
  };

  return (
    <SafeAreaView style={styles.calorieScreen}>
      <View style={styles.calorieHeaderTextView}>
        <Text style={styles.calorieHeaderText}>How much should you eat?</Text>
      </View>
      <View style={{ marginHorizontal: 10, zIndex: 1 }}>
        <View>
          <View style={styles.entries}>
            <Text style={styles.calorieInputTitleText}>Age: </Text>
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
            <Text style={styles.calorieInputTitleText}>Height: </Text>
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
          <View style={styles.entriesDropDown}>
            <Text style={styles.calorieInputTitleText}>Gender: </Text>
            <View
              style={{
                width: "74%",
                borderRadius: 30,
                marginLeft: 10,
                marginVertical: 8,
                shadowOpacity: 0.5,
                shadowColor: "#bdbcbc",
                shadowOffset: { height: 3 },
                shadowRadius: 5,
                borderRadius: 5,
                backgroundColor: "white",
              }}
            >
              <RNPickerSelect
                placeholder={placeholder}
                items={items}
                onValueChange={(value) => {
                  onChangeGender(value);
                }}
                style={pickerSelectStyles}
                value={gender}
              />
            </View>
          </View>
        </View>
        <View>
          <View style={styles.entries}>
            <Text style={styles.calorieInputTitleText}>Weight: </Text>
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
        style={styles.buttonCalorie}
        onPress={() => {
          Keyboard.dismiss();
          calorieCounterFunc();
        }}
      >
        <Text style={styles.calorieButtonText}>Calculate</Text>
      </TouchableOpacity>

      {error ? (
        Alert.alert(errorHeader, errorMessage, [
          {
            text: "OK",
            onPress: () => {
              setError(null);
              setCaldata([]);
            },
          },
        ])
      ) : (
        <FlatList
          data={calData}
          renderItem={CaloriDisplay}
          keyExtractor={(item) => item.calory}
          persistentScrollbar={true}
        />
      )}
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
  panelBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "black",
    paddingTop: 3,
    marginLeft: 20,
    marginRight: 30,
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
    overflow: "hidden",
  },
  buttonCalorie: {
    margin: 8,
    marginTop: 15,
    elevation: 8,
    backgroundColor: "#943100",
    borderRadius: 50,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginHorizontal: 150,
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
    fontSize: 22,
    color: "#fff",
    fontWeight: "400",
    alignSelf: "center",
  },
  calorieButtonText: {
    fontSize: 21,
    color: "#fff",
    fontWeight: "300",
    alignSelf: "center",
  },
  calorieScreen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  calorieHeaderTextView: {
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    width: "90%",
    height: 50,
    margin: 20,
    paddingHorizontal: 20,
  },
  calorieHeaderText: {
    fontSize: 20,
    color: "#79452B",
    fontWeight: "bold",
    alignSelf: "center",
  },
  calorieInputTitleText: {
    fontSize: 18,
    fontWeight: "bold",
    width: 80,
    color: "black",
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
    padding: 10,
    shadowOpacity: 0.5,
    shadowColor: "#bdbcbc",
    shadowOffset: { height: 3 },
    shadowRadius: 5,
    borderRadius: 5,
    backgroundColor: "white",
  },
  RecipeScreen: {
    flex: 1,
    backgroundColor: "#f0eeed",
  },
  recipeCardView: {
    backgroundColor: "#ecb397",
    marginVertical: 10,
    marginHorizontal: 30,
    shadowOpacity: 0.5,
    shadowColor: "#bdbcbc",
    shadowOffset: { height: 3 },
    shadowRadius: 5,
    borderRadius: 5,
    backgroundColor: "white",
  },
  recipeImageView: {
    justifyContent: "center",
  },
  recipeCardImage: {
    width: "95%",
    marginTop: 8,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1.9,
    borderColor: "black",
    borderRadius: 5,
    borderWidth: 0,
  },
  recipeCardTitleView: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    alignItems: "center",
  },
  recipeCardTitleText: {
    fontWeight: "bold",
    fontSize: 20,
  },
  recipecardinfoview: {
    fontSize: 20,
    fontWeight: "bold",
    margin: 10,
  },
  containerFoodPanel: {
    flex: 1,
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
    justifyContent: "center",
  },
  recipeViewButton: {
    alignItems: "center",
  },
  recipeViewText: {
    textAlign: "center",
    paddingVertical: 6,
    color: "#79452B",
    fontSize: 18,
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    borderColor: "black",
    margin: 5,
    paddingHorizontal: 15,
    height: 35,
  },
  tagButtonText: {
    textAlign: "center",
    color: "black",
    fontSize: 18,
    fontWeight: "350",
  },
  entriesDropDown: {
    zIndex: 1,
    flexDirection: "row",
    paddingLeft: 10,
    alignItems: "center",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    width: "90%",
    marginLeft: 10,
    marginVertical: 12,
    backgroundColor: "white",
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "purple",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
});
