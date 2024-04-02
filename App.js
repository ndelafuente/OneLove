import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View, Button, Linking } from 'react-native';

import * as Location from 'expo-location';

import oneLove from './OneLover';
import Pointer from './components/Pointer';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [canesCoord, setCanesCoord] = useState(null);
  const [orderURL, setOrderURL] = useState(false);
  const [mapURL, setMapURL] = useState(false);
  const [canesOpen, setCanesOpen] = useState(false);

  useEffect(() => {
    (async () => {

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync();
      const canes = await oneLove(location);
      setCanesCoord(canes.geocodedCoordinate);
      setLocation(canes.c_siteName);
      setCanesOpen(isLocationOpen(canes.hours))

      const potentialOrderURL = `${canes.orderUrl.url}/location/raising-canes-${canes.c_storeCode}/menu`;
      if (Linking.canOpenURL(potentialOrderURL)) {
        setOrderURL(potentialOrderURL);
      }

      const { address } = canes;
      const ll = [canes.geocodedCoordinate.latitude, canes.geocodedCoordinate.longitude].join(',');
      const iosAddressString = new URL(`https://maps.apple.com/?address=${address.line1},${address.city}, ${address.region}  ${address.postalCode}, ${address.countryCode}&ll=${ll}&q=${canes.name}`);
      const potentialMapURL = Platform.OS === 'ios' ? iosAddressString.toString() : `geo:${ll}`
      if (Linking.canOpenURL(potentialMapURL)) {
        setMapURL(potentialMapURL)
      }

    })();
  }, []);

  let text = 'Waiting...';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    const canesStatusMsg = canesOpen ? "🕰 Cane's O'clock!" : "⛔ Closed :("
    text = ["Location: " + location, canesStatusMsg].join('\n');
  }

  return (
    <View style={styles.container}>
      {canesCoord && <Pointer targetCoordinate={canesCoord} />}
      <Text>{text}</Text>
      <View style={styles.buttonRow}>
        {orderURL && <Button
          title="Order now"
          color="#d71c2e"
          onPress={() => Linking.openURL(orderURL)}
        />}
        {mapURL && <Button
          title="Open in Maps"
          onPress={() => Linking.openURL(mapURL)}
        />}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});


// Helper functions
function dateFromTimeString(timeString) {
  const date = new Date();

  const [hours, minutes] = timeString.split(':');
  date.setHours(parseInt(hours));
  date.setMinutes(parseInt(minutes));

  return date;
}

function isLocationOpen(hours) {
  const today = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekday = dayNames[today.getDay()];
  const { openIntervals } = hours[weekday];
  for (const { start, end } of openIntervals) {
    const startDate = dateFromTimeString(start);
    const endDate = dateFromTimeString(end);

    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    if (today >= startDate && today <= endDate) {
      return true;
    }
  }
  return false;
}
