import Head from 'next/head'
import { useState, useEffect } from "react";
import Filters from "../components/Filters";
import CourseInfoTable from "../components/CourseTable";
import { Header } from '../components/Header';
import { supabase } from "../lib/supabase";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [holes, setHoles] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  // Fetch from Supabase course_info table
  useEffect(() => {
    async function fetchCourses() {
      try {
        let data, error;
        
        // If user location is available, use RPC function with distance calculation
        if (userLocation && userLocation.lat && userLocation.lng) {
          console.log('Fetching courses with distance from:', userLocation);
          const result = await supabase.rpc('courses_with_distance', { 
            user_lat: userLocation.lat, 
            user_lng: userLocation.lng 
          });
          data = result.data;
          error = result.error;
        } else {
          // Otherwise, use regular query without distance
          console.log('Fetching courses without distance');
          const result = await supabase
            .from('course_info')
            .select(`
              id, 
              name, 
              region, 
              website,
              course_layouts(holes, par, rating, slope, length),
              course_stats(num_members, full_membership, unaffiliated_gf, affiliated_gf, date)
            `);
          data = result.data;
          error = result.error;
        }
        
        if (!error && data && data.length > 0) {
          // If using regular query, keep only the most recent stats per course
          let coursesWithLatestStats;
          if (!userLocation) {
            coursesWithLatestStats = data.map(course => {
              const sortedStats = course.course_stats?.sort((a, b) => new Date(b.date) - new Date(a.date)) || [];
              return {
                ...course,
                course_stats: sortedStats.length > 0 ? [sortedStats[0]] : []
              };
            });
          } else {
            // RPC function should already return properly formatted data
            coursesWithLatestStats = data;
          }
          
          setCourses(coursesWithLatestStats);
          console.log('Loaded courses from Supabase:', coursesWithLatestStats.length);
        } else {
          console.log('No data from Supabase');
          console.log('Error:', error);
        }
      } catch (err) {
        console.log('Supabase error:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourses();
  }, [userLocation?.lat, userLocation?.lng]);

  return (
    <>
      <Head>
        <title>Kiwi Fairways | Your guide to golf in beautiful Aotearoa / New Zealand</title>
        <meta name="description" content="Discover golf courses across New Zealand. Compare green fees, membership costs, course info and more with Kiwi Fairways." />
        <meta name="robots" content="index, follow" />
        <meta name="google-site-verification" content="G0XKtNBfO_ZBQuZAXhG8_DZmOJbRo0H-MUHhtEES1fo" />
        <link rel="canonical" href="https://kiwifairways.nz" />

        {/* Favicons */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Kiwi Fairways" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Open Graph */}
        <meta property="og:title" content="Kiwi Fairways | Your guide to golf in New Zealand" />
        <meta property="og:description" content="Discover and compare golf courses, green fees and membership options across Aotearoa." />
        <meta property="og:url" content="https://kiwifairways.nz" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://kiwifairways.nz/images/share-image.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kiwi Fairways" />
        <meta name="twitter:description" content="Your ultimate golf course guide for New Zealand." />
        <meta name="twitter:image" content="https://kiwifairways.nz/images/share-image.jpg" />
        
      </Head>
      <div className="container">
        <Header />
        <Filters
          search={search}
          region={region}
          holes={holes}
          onSearch={setSearch}
          onRegionChange={setRegion}
          onHolesChange={setHoles}
          onLocationSelect={setUserLocation}
          courses={courses}
        />
        <div className="content-section">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading courses...</p>
            </div>
          ) : (
            <CourseInfoTable
              courses={courses}
              search={search}
              region={region}
              holes={holes}
              userLocation={userLocation}
            />
          )}
        </div>
      </div>
    </>
  );
}