import { View, Text, Button, TextInput } from "react-native";
import { Paths, File ,Directory} from "expo-file-system";
import { useState } from "react";

export default function WriteinFile() {
   const url =
      "hhttps://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4W5se-3sXcI-CuvSm5GbPoSk655stnvqEeWyX1M79KA&s=10";
  const [Data, setData] = useState("");
  const [Get, setGet] = useState("");

  const handleData = async () => {
    const newfiles = new File(Paths.document, "new.txt");

    if (!newfiles.exists) {
      newfiles.create();
    }

    newfiles.write(Data);

    const result = await newfiles.text();

    
    console.log(result);
    setGet(result);
  };
  const handleDownload = async ()=>{
const newdir = new Directory(Paths.document , "pdfed");
newdir.create({idempotent : true,intermediates:true })
 const file =
      await File.downloadFileAsync(
        url,
        newdir
      );

      console.log("download pdf")
    
  }

  return (
    <View style={{ flex: 1, justifyContent: "center" , backgroundColor:"white" }}>
      <TextInput
        value={Data}
        onChangeText={setData}
        placeholder="Enter text"
      />

      <Button title="Read" onPress={handleData} />
 <Button title="Download" onPress={handleDownload} />
      <Text>{Get}</Text>
    </View>
  );
}