import { combineReducers } from '@reduxjs/toolkit';

/**
 * Example placeholder reducers.
 * Extend with real slices as the application grows.
 */
const dummyReducer = (state = { initialized: true }, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  dummy: dummyReducer,
  // Add additional reducers here, e.g. auth: authReducer,
});

export default rootReducer;
