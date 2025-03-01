import React, { Component } from 'react';
import Search from './Search.js';
import RestaurantResults from './RestaurantResults.js';
import API from '../utils/api';

class Results extends Component {
  constructor(props) {
    super(props)
    this.state = {
      query: '',
      businesses: [],
      error: null
    }
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange = (e) => {
    this.setState({ query: e.target.value });
  }

  preventing = async (e) => {
    e.preventDefault();
    console.log('Submitting search with query:', this.state.query);
    
    try {
        console.log('Making API request...');
        const response = await API.post('/saved/results', {
            location: this.state.query,
        });
        console.log('Raw API response:', response);
        
        const data = response.data;
        console.log('Parsed data:', data);
        
        if (!data.businesses) {
            throw new Error('No businesses found in response');
        }
        
        this.setState({ 
            businesses: data.businesses,
            error: null 
        });
    } catch (error) {
        const errorDetails = error.response?.data?.details || error.message;
        console.error('Search failed:', {
            error: error.response?.data,
            status: error.response?.status,
            details: errorDetails
        });
        
        this.setState({ 
            error: `Failed to fetch restaurants: ${errorDetails}`,
            businesses: [] 
        });
    }
  }

  saveClick = async (e) => {
    e.preventDefault();
    const businessToSave = this.state.businesses.find(function(b) {
      return b.id === e.target.id;
    });
    
    if (!businessToSave) {
      console.error('Business not found');
      return;
    }

    try {
      const response = await API.post('/saved/results/restaurantsaved', {
        business: businessToSave,
        user: this.props.user,
      });
      console.log('Restaurant saved successfully:', response.data);
    } catch (error) {
      console.error('Failed to save restaurant:', error.message);
    }
  }

  render() {
    const { businesses, error } = this.state;

    return (
      <div className="container Results">
        <div className="row">
          <Search 
            query={this.state.query} 
            handleInputChange={this.handleInputChange} 
            preventing={this.preventing} 
          />
          
          {error && (
            <div className="col s12">
              <p className="red-text">{error}</p>
            </div>
          )}

          <RestaurantResults 
            businesses={businesses} 
            saveClick={this.saveClick} 
          />
        </div>
      </div>
    );
  }
}

export default Results;