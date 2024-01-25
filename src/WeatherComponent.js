import React, { useState, useEffect } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  ListItemText,
  Checkbox,
  Button,
} from "@mui/material";

const WeatherComponent = () => {
  const [locations, setLocations] = useState({ areas: [], cities: [] });
  const [layers, setLayers] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [startEndDates, setStartEndDates] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState();
  const [selectedEndDate, setSelectedEndDate] = useState();
  const [existRecords, setExistRecords] = useState({
    exist_weather_images: false,
    exist_weather_data: false,
    exist_weather_images_with_data: false,
  });
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedLayer, setSelectedLayer] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const handleStartDateChange = (event) => {
    setSelectedStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setSelectedEndDate(event.target.value);
  };

  const handleAreaChange = (event) => {
    setSelectedArea(event.target.value);
    setSelectedLocation(event.target.value);
    setSelectedCity(""); // Reset city when area is changed
    fetchExistsData(event.target.value);
    setStartEndDates([]);
    setSelectedStartDate("");
    setSelectedEndDate("");
    setSelectedOption("");
  };

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
    setSelectedLocation(event.target.value);
    setSelectedArea(""); // Reset area when city is changed
    fetchExistsData(event.target.value);
    setSelectedOption("");
    setStartEndDates([]);
    setSelectedStartDate("");
    setSelectedEndDate("");
  };

  // Set the API address
  const apiAddress = "http://158.193.177.12:5000";

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${apiAddress}/api/available_locations`);
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchExistsData = async (location) => {
    try {
      const response = await fetch(
        `${apiAddress}/api/exist_records/${location}`
      );
      const data = await response.json();
      setExistRecords(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchLayers = async () => {
    const locationParameter = selectedArea || selectedCity;

    try {
      const response = await fetch(
        `${apiAddress}/api/available_layers/${locationParameter}`
      );
      const data = await response.json();
      setLayers(data.layers);
    } catch (error) {
      console.error("Error fetching layers:", error);
    }
  };

  const fetchLayersWithData = async () => {
    const locationParameter = selectedArea || selectedCity;
    try {
      const response = await fetch(
        `${apiAddress}/api/available_layers/${locationParameter}`
      );
      const data = await response.json();
      setLayers(data.layers_with_data);
    } catch (error) {
      console.error("Error fetching layers:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (selectedOption === "exist_weather_images") {
        await fetchLayers();
      } else if (selectedOption === "exist_weather_images_with_data") {
        await fetchLayersWithData();
      }
    };

    fetchData();
  }, [selectedOption]);

  const fetchDates = async () => {
    try {
      const response = await fetch(
        `${apiAddress}/api/available_dates/${selectedLocation.trim()}/${selectedLayer}`
      );
      const data = await response.json();
      let formattedStartEndDates;

      if (selectedOption === "exist_weather_images") {
        formattedStartEndDates = formatDates(
          data.range_data_weather_data_id_null
        );
      } else if (selectedOption === "exist_weather_data") {
        formattedStartEndDates = formatDates(data.range_data_weather_data);
      } else if (selectedOption === "exist_weather_images_with_data") {
        formattedStartEndDates = formatDates(
          data.range_data_weather_data_id_not_null
        );
      }

      setStartEndDates(formattedStartEndDates);
    } catch (error) {
      console.error("Error fetching dates:", error);
    }
  };

  const formatDates = (datesArray) => {
    return datesArray.map((date) => formatDate(date));
  };

  const formatDate = (date) => {
    const [day, month, year] = date.split(".");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!selectedOption) {
      return;
    }
    if (
      selectedOption === "exist_weather_images_with_data" &&
      (!selectedLayer || selectedItems.length === 0)
    ) {
      return;
    }

    if (selectedOption === "exist_weather_data" && selectedItems.length === 0) {
      return;
    }
    if (!selectedLayer) {
      // Set selectedLayer to some random value
      setSelectedLayer("randomLayer");
    }

    fetchDates();
  }, [selectedLayer, selectedItems]);

  const fetchWeatherImages = async () => {
    if (selectedStartDate === selectedEndDate) {
      const startDate = new Date(selectedStartDate);
      startDate.setDate(startDate.getDate() - 1);
      setSelectedStartDate(startDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
      const endDate = new Date(selectedEndDate);
      endDate.setDate(endDate.getDate() + 1);
      setSelectedEndDate(endDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    }
    try {
      const response = await fetch(
        `${apiAddress}/api/weather_images/${selectedLocation}/${selectedLayer}/${selectedStartDate}/${selectedEndDate}`
      );

      const filename = `weather_images_${selectedLocation}.zip`;

      // Convert the response to a Blob
      const blob = await response.blob();

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;

      // Append the link to the body and programmatically trigger a click event
      document.body.appendChild(link);
      link.click();

      // Remove the link element
      document.body.removeChild(link);

      // Clean up the Blob
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error fetching weather images:", error);
    }
  };

  const fetchWeatherData = async () => {
    const additionalTypes = ["latitude", "longitude", "weather", "description"];
    const allWeatherDataTypes = [...additionalTypes, ...selectedItems];
    if (selectedStartDate === selectedEndDate) {
      const startDate = new Date(selectedStartDate);
      startDate.setDate(startDate.getDate() - 1);
      setSelectedStartDate(startDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
      const endDate = new Date(selectedEndDate);
      endDate.setDate(endDate.getDate() + 1);
      setSelectedEndDate(endDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    }

    // Convert the array to a comma-separated string
    const weatherDataTypesString = allWeatherDataTypes.join(", ");
    console.log(weatherDataTypesString);
    try {
      const response = await fetch(
        `${apiAddress}/api/weather_data/${selectedLocation.trim()}/${weatherDataTypesString}/${selectedStartDate}/${selectedEndDate}`
      );

      const filename = `weather_data_${selectedLocation}.zip`;

      // Convert the response to a Blob
      const blob = await response.blob();

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;

      // Append the link to the body and programmatically trigger a click event
      document.body.appendChild(link);
      link.click();

      // Remove the link element
      document.body.removeChild(link);

      // Clean up the Blob
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  const fetchWeatherImagesAndData = async () => {
    const additionalTypes = ["latitude", "longitude", "weather", "description"];
    const allWeatherDataTypes = [...additionalTypes, ...selectedItems];
    if (selectedStartDate === selectedEndDate) {
      const startDate = new Date(selectedStartDate);
      startDate.setDate(startDate.getDate() - 1);
      setSelectedStartDate(startDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
      const endDate = new Date(selectedEndDate);
      endDate.setDate(endDate.getDate() + 1);
      setSelectedEndDate(endDate.toISOString().split("T")[0]); // Format as YYYY-MM-DD
    }
    try {
      const response = await fetch(
        `${apiAddress}/api/weather_images_and_data/${selectedLocation.trim()}/${selectedLayer}/${allWeatherDataTypes}/${selectedStartDate}/${selectedEndDate}`
      );

      const filename = `weather_images_and_data_${selectedLocation}.zip`;

      // Convert the response to a Blob
      const blob = await response.blob();

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;

      // Append the link to the body and programmatically trigger a click event
      document.body.appendChild(link);
      link.click();

      // Remove the link element
      document.body.removeChild(link);

      // Clean up the Blob
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error fetching weather images and data:", error);
    }
  };

  const downloadData = async () => {
    if (selectedOption === "exist_weather_images") {
      await fetchWeatherImages();
    } else if (selectedOption === "exist_weather_data") {
      await fetchWeatherData();
    } else if (selectedOption === "exist_weather_images_with_data") {
      await fetchWeatherImagesAndData();
    }
  };

  const formControlStyle = {
    margin: "8px", // Adjust the margin as needed
    minWidth: "200px", // Adjust the minWidth to your preferred value
  };

  const handleSelectedOptionChange = (event) => {
    setSelectedOption(event.target.value);
    setSelectedLayer("");
    setSelectedItems([]);
  };

  const itemsList = [
    "temp_kelvin",
    "temp_celsius",
    "temp_fahrenheit",
    "feels_like_kelvin",
    "feels_like_celsius",
    "feels_like_fahrenheit",
    "temp_min_kelvin",
    "temp_min_celsius",
    "temp_min_fahrenheit",
    "temp_max_kelvin",
    "temp_max_celsius",
    "temp_max_fahrenheit",
    "pressure",
    "humidity",
    "visibility",
    "wind_speed",
    "wind_deg",
    "clouds",
    "sunrise_time",
    "sunset_time",
  ];

  const handleItemsChange = (event) => {
    setSelectedItems(event.target.value);
  };

  const handleLayerChange = (event) => {
    setSelectedLayer(event.target.value);
  };

  return (
    <div>
      {/* Select for Areas */}
      <FormControl style={formControlStyle}>
        <InputLabel id="area-select-label">
          {locations.areas.length === 0 ? "Not available" : "Area"}
        </InputLabel>
        <Select
          id="area-select"
          value={selectedArea}
          onChange={handleAreaChange}
          disabled={locations.areas.length === 0}
          label="Area"
        >
          {locations.areas.length === 0 ? (
            <MenuItem disabled value="">
              Not available
            </MenuItem>
          ) : (
            locations.areas.map((area) => (
              <MenuItem key={area} value={area}>
                {area}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Select for Cities */}
      <FormControl style={formControlStyle}>
        <InputLabel id="city-select-label">
          {locations.cities.length === 0 ? "Not available" : "City"}
        </InputLabel>
        <Select
          id="city-select"
          value={selectedCity}
          onChange={handleCityChange}
          disabled={locations.cities.length === 0}
          label="City"
        >
          {locations.cities.length === 0 ? (
            <MenuItem disabled value="">
              Not available
            </MenuItem>
          ) : (
            locations.cities.map((city) => (
              <MenuItem key={city} value={city}>
                {city}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>
      {(selectedArea || selectedCity) && (
        <FormControl component="fieldset">
          <FormLabel component="legend">Select Option</FormLabel>
          <RadioGroup
            aria-label="exist-records"
            name="exist-records"
            value={selectedOption ?? ""}
            onChange={handleSelectedOptionChange}
          >
            <FormControlLabel
              value="exist_weather_data"
              control={<Radio />}
              label="Weather data"
              disabled={!existRecords.exist_weather_data}
            />
            <FormControlLabel
              value="exist_weather_images"
              control={<Radio />}
              label="Weather images"
              disabled={!existRecords.exist_weather_images}
            />
            <FormControlLabel
              value="exist_weather_images_with_data"
              control={<Radio />}
              label="Images with data"
              disabled={!existRecords.exist_weather_images_with_data}
            />
          </RadioGroup>
        </FormControl>
      )}

      {(selectedOption === "exist_weather_data" ||
        selectedOption === "exist_weather_images_with_data") && (
        <FormControl sx={{ m: 1, width: 300 }}>
          <InputLabel id="items-select-label">Select data</InputLabel>
          <Select
            labelId="items-select-label"
            label="Select data"
            id="items-select"
            multiple
            placeholder="Select items to download"
            value={selectedItems}
            onChange={handleItemsChange}
            renderValue={(selected) =>
              selected.length > 0 ? `${selected.length} selected` : "0 selected"
            }
          >
            {itemsList.map((item) => (
              <MenuItem key={item} value={item}>
                <Checkbox checked={selectedItems.includes(item)} />
                <ListItemText primary={item} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {(selectedOption === "exist_weather_images" ||
        selectedOption === "exist_weather_images_with_data") &&
        layers != undefined && (
          <FormControl sx={{ m: 1, width: 300 }}>
            <InputLabel id="items-select-label">Select layers</InputLabel>
            <Select
              labelId="items-select-label"
              label="Select layers"
              id="items-select"
              value={selectedLayer}
              onChange={handleLayerChange}
              renderValue={(selected) =>
                selected.length > 0 ? "Layer selected" : "Not selected"
              }
            >
              {layers.map((layer) => (
                <MenuItem key={layer} value={layer}>
                  <Checkbox checked={selectedLayer.includes(layer)} />
                  <ListItemText primary={layer} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      <div>
        {startEndDates.length > 0 && (
          <>
            <div>
              <label htmlFor="start-date">Start Date:</label>
              <input
                type="date"
                id="start-date"
                value={selectedStartDate}
                onChange={handleStartDateChange}
                min={startEndDates[0]} // Set min attribute to the min date
                max={startEndDates[1]} // Set max attribute to the max date
              />

              <label htmlFor="end-date">End Date:</label>
              <input
                type="date"
                id="end-date"
                value={selectedEndDate}
                onChange={handleEndDateChange}
                min={startEndDates[0]} // Set min attribute to the min date
                max={startEndDates[1]} // Set max attribute to the max date
              />

              <p>
                Min date: {startEndDates[0]} Max date: {startEndDates[1]}
              </p>
            </div>
          </>
        )}
        <br />
        {selectedStartDate && selectedEndDate && startEndDates.length > 0 && (
          <Button variant="contained" onClick={downloadData}>
            DOWNLOAD
          </Button>
        )}
      </div>
    </div>
  );
};

export default WeatherComponent;
