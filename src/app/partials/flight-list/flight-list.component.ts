import { Component, OnInit } from '@angular/core';
import { FormBuilder,FormGroup, Validators } from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import { FlightDataService } from '../../../app/service/flightData/flight-data.service';

const city = ['Pune (PNQ)', 'Mumbai (BOM)', 'Bengalaru (BLR)', 'Delhi (DEL)'] 
@Component({
  selector: 'app-flight-list',
  templateUrl: './flight-list.component.html',
  styleUrls: ['./flight-list.component.scss']
})

export class FlightListComponent implements OnInit {
  flightList:any;
  public searchFormFields  : FormGroup;
  public formUserData;
  public tripType : number = 0;
  public priceRange : number = 15000;
  defaultDepartureDate = new Date('2020/11/01');

  filteredOptions: Observable<string[]>;
  selectedOriginCity = city[1];
  selectedDestinationCity = city[3];

  result: any;
  filteredResult:any;
  resultReturnFlights: any;
  filterConnectedFlights:any;
  finalResult: any = { oneWay:{ flights:[]}, return:{ flights:[]} };
  constructor(private formBuilder : FormBuilder, public flightDataService : FlightDataService) { }

  ngOnInit(): void {
    this.searchFormFields = this.formBuilder.group({
      tripType : [this.tripType],
      originCity:[this.selectedOriginCity],
      destinationCity:[this.selectedDestinationCity, [Validators.required]],
      departureDate: [this.defaultDepartureDate,[]],
      returnDate: ['',[]],
      passengerCount:[1,[Validators.required, Validators.max(5), Validators.min(1)]],
      priceRange:[0,[]]
    })
    this.fetchFlightData()
    this.filteredOptions = this.searchFormFields.controls.originCity.valueChanges
    .pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }


  fetchFlightData = () =>{
    this.flightDataService.getAllFlightData().subscribe( res =>{  
      this.flightList = res;
      this.flightList.forEach((flight) => {
        flight.arrivalTime = (new Date (new Date().toDateString() + ' ' + flight.arrivalTime))
        flight.date =new Date( new Date(flight.date).toISOString());
        flight.departureTime = (new Date (new Date().toDateString() + ' ' + flight.departureTime)) 
      });
      if(this.flightList !=0){
        let directFlights= (this.filterDirectFlights( this.selectedOriginCity, this.selectedDestinationCity, this.defaultDepartureDate))
        this.finalResult.oneWay.flights=[...this.finalResult.oneWay.flights, ...directFlights]
      }
    })
  }
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return city.filter(option => option.toLowerCase().includes(filterValue));
  }
  formatLabel(value: number) {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }
    return value;
  }
  onSubmit=function(){
    if(this.searchFormFields.invalid){
      alert("Please check if form inputs are valid")
    }
    else{
      let params = this.searchFormFields.value;
      this.finalResult.oneWay.flights=[];
      this.finalResult.return.flights=[];
      let directFlight=this.filterDirectFlights( params.originCity, params.destinationCity, params.departureDate);
      this.finalResult.oneWay.flights = [...this.finalResult.oneWay.flights, ...directFlight];
      if(params.tripType == 1){
        let returnFlight =(this.filterDirectFlights(params.destinationCity, params.originCity, params.returnDate));
        this.finalResult.return.flights = [...this.finalResult.return.flights,...returnFlight];
      }

      if(params.priceRange > 0){
       this.finalResult.oneWay.flights = this.filterByPriceRange(params.priceRange, this.finalResult.oneWay.flights) 
       if(params.tripType == 1){
        this.finalResult.return.flights = this.filterByPriceRange(params.priceRange, this.finalResult.return.flights) 
       }
      }
    }
  }

  filterDirectFlights = (source: string, dest: string, dept_date ?:any) => {
    let result = [];
    this.flightList.filter((flight) =>{
      if((flight.origin == source) && (flight.destination== dest) && (new Date(flight.date).toISOString() == new Date(dept_date).toISOString()) ){
        flight['hops'] = [{
          arrivalTime: flight.arrivalTime,
          date: flight.date,
          departureTime: flight.departureTime,
          destination: flight.destination,
          flightNo: flight.flightNo,
          name: flight.name,
          origin: flight.origin,
          price: flight.price
        }];
        result.push(flight)
      }
    })
    this.getTotal(result);
    this.filterByConnectingFlights(source, dest, dept_date);
    return result;
  }

  filterByPriceRange = (price, arr) => {
    if(price >0){
      return arr.filter((flight) => {
        if(flight.total_sum <= price){ return flight; }
      });
    }
  }

  filterByConnectingFlights = (source: string, dest: string, dept_date: any) =>{
    let sourceFlightsOneWay = this.getFlightsFromOrigin(source,dest, dept_date);
    let destFlightsOneWay = this.getFlightsToDestination(source,dest, dept_date);
    let connectingOneWay =this.filterFlightsCompareTime(sourceFlightsOneWay, destFlightsOneWay);
    this.finalResult.oneWay.flights = [...this.finalResult.oneWay.flights,...connectingOneWay]
    this.getTotal(this.finalResult.oneWay.flights);

    if(this.searchFormFields.value.tripType == 1){
      let sourceFlightsReturn = this.getFlightsFromOrigin(dest, source, dept_date);
      let destFlightsReturn = this.getFlightsToDestination(dest, source, dept_date);
      let connectingReturn = this.filterFlightsCompareTime(sourceFlightsReturn, destFlightsReturn);
      this.finalResult.return.flights = [...this.finalResult.return.flights,...connectingReturn]
      this.getTotal(this.finalResult.return.flights);
    }
  }

  getFlightsFromOrigin = (source: string, dest: string, dept_date: any) =>{
    return this.flightList.filter((flight) =>{
      if((flight.origin == source) && (flight.destination != dest) && (new Date(flight.date).toISOString() == new Date(dept_date).toISOString())){
        return flight;
      }
    })
  }

  getFlightsToDestination = (source: string, dest: string, dept_date: any) =>{
    return this.flightList.filter((flight) =>{
      if((flight.destination == dest) && (flight.source != source) &&(new Date(flight.date).toISOString() == new Date(dept_date).toISOString())){
        return flight;
      }
    })
  };

  filterFlightsCompareTime(dataSet1, dataSet2){
    let result=[];
    let flightData = [];
    let tempFlightData = dataSet1.forEach((inFlight) => {
      return dataSet2.filter((outFlight) => {
        if((new Date(inFlight.arrivalTime).getTime()+(30*60000)) <= new Date(outFlight.departureTime).getTime() ){
          let flightEntry=[];
          flightEntry.push(inFlight);
          flightEntry.push(outFlight);
          result.push(flightEntry);
        }
      })
    });

    result.forEach(data =>{
      let flight = {
        arrivalTime: data[data.length-1].arrivalTime,
        date: data[0].date,
        departureTime:data[0].departureTime,
        destination: data[data.length-1].destination,
        flightNo:data[0].flightNo,
        name:data[0].name,
        origin:data[0].origin,
        hops: data
      }
      flightData.push(flight)
    })
    return flightData;
  }

  getTotal= (dataSet) =>{
    return dataSet.forEach((element)=>{
      let time = this.getDuration(element.departureTime, element.arrivalTime);
      let sum = 0;
      element.hops.forEach((flight, index) =>{
        let hop_time = this.getDuration(flight.departureTime, flight.arrivalTime);
        sum+= flight.price
        flight['flight_duration'] = hop_time;
      })
      element['total_duration'] = time;
      element['total_sum'] = sum;
    })
  }

  getDuration = (startTime, endTime ) =>{
    let diff =(endTime.getTime() - startTime.getTime()) / 1000;
    diff /= (60);          
    let hours = Math.floor(diff / 60);  
    let minutes = diff % 60;
    return hours + ''+(minutes == 0? '': ':'+minutes);
  }
}
