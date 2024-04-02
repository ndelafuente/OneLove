
export default async function oneLove(location) {
   console.log(location.coords)
   const url = new URL("https://prod-cdn.us.yextapis.com/v2/accounts/me/search/vertical/query");

   const params = new URLSearchParams({
      "experienceKey": "locator",
      "api_key": "6c78315e15b82a7cccbbf3fad5db0958",
      "v": "20220511",
      "version": "PRODUCTION",
      "locale": "en",
      "verticalKey": "locations",
      "filters": JSON.stringify({
         "builtin.location": {
            "$near": {
               "lat": location.coords.latitude,
               "lng": location.coords.longitude,
               "radius": 40000
            }
         }
      }),
      "limit": 10,
      "offset": 0,
      "retrieveFacets": true,
      "source": "STANDARD"
   });

   url.search = params.toString();

   return fetch(url)
      .then((response) => {
         if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
         }

         return response.json();
      })
      .then((json) => json.response.results[0].data);
}