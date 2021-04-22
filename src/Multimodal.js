import { SearchResult } from 'trompa-multimodal-component'
import { gql } from "@apollo/client";

class AudioObject {
    static filters = [{
        onProperty: 'format',
        name      : 'format',
    }];

    static searchAllQuery = gql`
    query($query: String!, $first: Int = 9999) {
      allResults: searchMetadataText(onTypes: [AudioObject], onFields: [title], substring: $query, first: $first) {
        ... on AudioObject {
          identifier
          format
          _searchScore
        }
      }
    }
  `;

    static searchQuery = gql`
    query($filter: _AudioObjectFilter) {
      results: AudioObject(filter: $filter, first: 50) {
        __typename
        ... on AudioObject {
          identifier
          name
          title
          contributor
          creator
          source
          contentUrl
          format
          encodingFormat
        }
      }
    }
  `;
}

export default AudioObject;

export const renderSearchResult = (type, item, onClick) => {
    return <SearchResult title={item.title} variant="default" onClick={() => onClick(item)} />
};