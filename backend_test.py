#!/usr/bin/env python3
"""
Backend API Testing for Social Media Calendar Management System
Tests all high-priority backend endpoints with comprehensive validation
"""

import requests
import json
from datetime import datetime, date, timedelta
import uuid
import sys
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip() + '/api'
        return None
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("ERROR: Could not get backend URL from frontend/.env")
    sys.exit(1)

print(f"Testing backend at: {BACKEND_URL}")

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = {
            'website_management': {'passed': 0, 'failed': 0, 'errors': []},
            'social_posts': {'passed': 0, 'failed': 0, 'errors': []},
            'calendar_events': {'passed': 0, 'failed': 0, 'errors': []},
            'dashboard_stats': {'passed': 0, 'failed': 0, 'errors': []},
            'content_generation': {'passed': 0, 'failed': 0, 'errors': []}
        }
        self.created_resources = {
            'websites': [],
            'posts': [],
            'events': []
        }

    def log_result(self, category, test_name, success, error_msg=None):
        if success:
            self.test_results[category]['passed'] += 1
            print(f"✅ {test_name}")
        else:
            self.test_results[category]['failed'] += 1
            self.test_results[category]['errors'].append(f"{test_name}: {error_msg}")
            print(f"❌ {test_name}: {error_msg}")

    def test_website_management_api(self):
        print("\n=== Testing Website Management API ===")
        
        # Test 1: Create website
        website_data = {
            "name": "Tech Startup Albania",
            "url": "https://techstartup.al",
            "description": "Albanian tech startup focused on innovation",
            "connected_platforms": ["facebook", "instagram", "linkedin", "twitter"]
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/websites", json=website_data)
            if response.status_code == 200:
                website = response.json()
                self.created_resources['websites'].append(website['id'])
                # Validate response structure
                required_fields = ['id', 'name', 'url', 'connected_platforms', 'created_at']
                if all(field in website for field in required_fields):
                    self.log_result('website_management', 'Create website', True)
                else:
                    self.log_result('website_management', 'Create website', False, 
                                  f"Missing required fields in response")
            else:
                self.log_result('website_management', 'Create website', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('website_management', 'Create website', False, str(e))

        # Test 2: Get all websites
        try:
            response = self.session.get(f"{BACKEND_URL}/websites")
            if response.status_code == 200:
                websites = response.json()
                if isinstance(websites, list) and len(websites) > 0:
                    self.log_result('website_management', 'Get all websites', True)
                else:
                    self.log_result('website_management', 'Get all websites', False, 
                                  "No websites returned or invalid format")
            else:
                self.log_result('website_management', 'Get all websites', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('website_management', 'Get all websites', False, str(e))

        # Test 3: Get specific website
        if self.created_resources['websites']:
            website_id = self.created_resources['websites'][0]
            try:
                response = self.session.get(f"{BACKEND_URL}/websites/{website_id}")
                if response.status_code == 200:
                    website = response.json()
                    if website['id'] == website_id:
                        self.log_result('website_management', 'Get specific website', True)
                    else:
                        self.log_result('website_management', 'Get specific website', False, 
                                      "Returned website ID doesn't match requested")
                else:
                    self.log_result('website_management', 'Get specific website', False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result('website_management', 'Get specific website', False, str(e))

        # Test 4: Update website
        if self.created_resources['websites']:
            website_id = self.created_resources['websites'][0]
            update_data = {
                "description": "Updated description for Albanian tech startup",
                "connected_platforms": ["facebook", "instagram", "linkedin", "twitter", "youtube"]
            }
            try:
                response = self.session.put(f"{BACKEND_URL}/websites/{website_id}", json=update_data)
                if response.status_code == 200:
                    updated_website = response.json()
                    if updated_website['description'] == update_data['description']:
                        self.log_result('website_management', 'Update website', True)
                    else:
                        self.log_result('website_management', 'Update website', False, 
                                      "Update not reflected in response")
                else:
                    self.log_result('website_management', 'Update website', False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result('website_management', 'Update website', False, str(e))

        # Test 5: Test invalid website ID (404 error handling)
        try:
            fake_id = str(uuid.uuid4())
            response = self.session.get(f"{BACKEND_URL}/websites/{fake_id}")
            if response.status_code == 404:
                self.log_result('website_management', 'Handle invalid website ID', True)
            else:
                self.log_result('website_management', 'Handle invalid website ID', False, 
                              f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result('website_management', 'Handle invalid website ID', False, str(e))

    def test_social_posts_api(self):
        print("\n=== Testing Social Posts Management API ===")
        
        # Ensure we have a website to reference
        if not self.created_resources['websites']:
            print("⚠️  No websites available for post testing, creating one...")
            self.test_website_management_api()
        
        if not self.created_resources['websites']:
            self.log_result('social_posts', 'Create post', False, "No website available for testing")
            return

        website_id = self.created_resources['websites'][0]
        
        # Test 1: Create social post
        post_data = {
            "website_id": website_id,
            "platform": "facebook",
            "content": "Exciting news from our Albanian tech startup! 🚀 #innovation #albania #tech",
            "media_urls": ["https://example.com/image1.jpg"],
            "scheduled_time": (datetime.utcnow() + timedelta(hours=2)).isoformat(),
            "ai_generated": False
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/posts", json=post_data)
            if response.status_code == 200:
                post = response.json()
                self.created_resources['posts'].append(post['id'])
                # Validate response structure and enum values
                required_fields = ['id', 'website_id', 'platform', 'content', 'status']
                valid_platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 
                                 'youtube', 'pinterest', 'snapchat', 'telegram', 'whatsapp']
                valid_statuses = ['draft', 'scheduled', 'posted', 'failed']
                
                if (all(field in post for field in required_fields) and 
                    post['platform'] in valid_platforms and 
                    post['status'] in valid_statuses):
                    self.log_result('social_posts', 'Create social post', True)
                else:
                    self.log_result('social_posts', 'Create social post', False, 
                                  "Invalid response structure or enum values")
            else:
                self.log_result('social_posts', 'Create social post', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('social_posts', 'Create social post', False, str(e))

        # Test 2: Get all posts
        try:
            response = self.session.get(f"{BACKEND_URL}/posts")
            if response.status_code == 200:
                posts = response.json()
                if isinstance(posts, list):
                    self.log_result('social_posts', 'Get all posts', True)
                else:
                    self.log_result('social_posts', 'Get all posts', False, "Invalid response format")
            else:
                self.log_result('social_posts', 'Get all posts', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('social_posts', 'Get all posts', False, str(e))

        # Test 3: Get posts with website filter
        try:
            response = self.session.get(f"{BACKEND_URL}/posts?website_id={website_id}")
            if response.status_code == 200:
                posts = response.json()
                if isinstance(posts, list) and all(post['website_id'] == website_id for post in posts):
                    self.log_result('social_posts', 'Filter posts by website', True)
                else:
                    self.log_result('social_posts', 'Filter posts by website', False, 
                                  "Filter not working correctly")
            else:
                self.log_result('social_posts', 'Filter posts by website', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('social_posts', 'Filter posts by website', False, str(e))

        # Test 4: Get posts with platform filter
        try:
            response = self.session.get(f"{BACKEND_URL}/posts?platform=facebook")
            if response.status_code == 200:
                posts = response.json()
                if isinstance(posts, list) and all(post['platform'] == 'facebook' for post in posts):
                    self.log_result('social_posts', 'Filter posts by platform', True)
                else:
                    self.log_result('social_posts', 'Filter posts by platform', False, 
                                  "Platform filter not working correctly")
            else:
                self.log_result('social_posts', 'Filter posts by platform', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('social_posts', 'Filter posts by platform', False, str(e))

        # Test 5: Update post status
        if self.created_resources['posts']:
            post_id = self.created_resources['posts'][0]
            update_data = {
                "status": "scheduled",
                "content": "Updated content for our Albanian tech startup! 🚀 #updated"
            }
            try:
                response = self.session.put(f"{BACKEND_URL}/posts/{post_id}", json=update_data)
                if response.status_code == 200:
                    updated_post = response.json()
                    if updated_post['status'] == 'scheduled':
                        self.log_result('social_posts', 'Update post status', True)
                    else:
                        self.log_result('social_posts', 'Update post status', False, 
                                      "Status update not reflected")
                else:
                    self.log_result('social_posts', 'Update post status', False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result('social_posts', 'Update post status', False, str(e))

        # Test 6: Test foreign key validation (invalid website_id)
        invalid_post_data = {
            "website_id": str(uuid.uuid4()),
            "platform": "instagram",
            "content": "This should fail due to invalid website_id",
            "scheduled_time": (datetime.utcnow() + timedelta(hours=1)).isoformat()
        }
        try:
            response = self.session.post(f"{BACKEND_URL}/posts", json=invalid_post_data)
            if response.status_code == 404:
                self.log_result('social_posts', 'Validate website_id foreign key', True)
            else:
                self.log_result('social_posts', 'Validate website_id foreign key', False, 
                              f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result('social_posts', 'Validate website_id foreign key', False, str(e))

    def test_calendar_events_api(self):
        print("\n=== Testing Calendar Events API ===")
        
        # Ensure we have a website to reference
        if not self.created_resources['websites']:
            print("⚠️  No websites available for calendar testing, creating one...")
            self.test_website_management_api()
        
        if not self.created_resources['websites']:
            self.log_result('calendar_events', 'Create calendar event', False, "No website available")
            return

        website_id = self.created_resources['websites'][0]
        
        # Test 1: Create calendar event
        event_data = {
            "website_id": website_id,
            "title": "Content Generation Session",
            "description": "Generate social media content for Albanian tech startup",
            "date": (date.today() + timedelta(days=1)).isoformat(),
            "time": "14:30",
            "type": "generation",
            "platform": "facebook"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/calendar", json=event_data)
            if response.status_code == 200:
                event = response.json()
                self.created_resources['events'].append(event['id'])
                # Validate response structure
                required_fields = ['id', 'website_id', 'title', 'date', 'time', 'type']
                valid_types = ['generation', 'posting', 'monitoring']
                
                if (all(field in event for field in required_fields) and 
                    event['type'] in valid_types):
                    self.log_result('calendar_events', 'Create calendar event', True)
                else:
                    self.log_result('calendar_events', 'Create calendar event', False, 
                                  "Invalid response structure or type values")
            else:
                self.log_result('calendar_events', 'Create calendar event', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('calendar_events', 'Create calendar event', False, str(e))

        # Test 2: Create different types of events
        event_types = [
            {"type": "posting", "title": "Social Media Posting Session", "time": "10:00"},
            {"type": "monitoring", "title": "Social Media Monitoring", "time": "16:00"}
        ]
        
        for event_type_data in event_types:
            event_data = {
                "website_id": website_id,
                "title": event_type_data["title"],
                "date": (date.today() + timedelta(days=2)).isoformat(),
                "time": event_type_data["time"],
                "type": event_type_data["type"],
                "platform": "instagram"
            }
            
            try:
                response = self.session.post(f"{BACKEND_URL}/calendar", json=event_data)
                if response.status_code == 200:
                    event = response.json()
                    self.created_resources['events'].append(event['id'])
                    self.log_result('calendar_events', f'Create {event_type_data["type"]} event', True)
                else:
                    self.log_result('calendar_events', f'Create {event_type_data["type"]} event', False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result('calendar_events', f'Create {event_type_data["type"]} event', False, str(e))

        # Test 3: Get all calendar events
        try:
            response = self.session.get(f"{BACKEND_URL}/calendar")
            if response.status_code == 200:
                events = response.json()
                if isinstance(events, list):
                    self.log_result('calendar_events', 'Get all calendar events', True)
                else:
                    self.log_result('calendar_events', 'Get all calendar events', False, 
                                  "Invalid response format")
            else:
                self.log_result('calendar_events', 'Get all calendar events', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('calendar_events', 'Get all calendar events', False, str(e))

        # Test 4: Filter events by website
        try:
            response = self.session.get(f"{BACKEND_URL}/calendar?website_id={website_id}")
            if response.status_code == 200:
                events = response.json()
                if isinstance(events, list) and all(event['website_id'] == website_id for event in events):
                    self.log_result('calendar_events', 'Filter events by website', True)
                else:
                    self.log_result('calendar_events', 'Filter events by website', False, 
                                  "Website filter not working correctly")
            else:
                self.log_result('calendar_events', 'Filter events by website', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('calendar_events', 'Filter events by website', False, str(e))

        # Test 5: Filter events by date range
        try:
            date_from = date.today().isoformat()
            date_to = (date.today() + timedelta(days=7)).isoformat()
            response = self.session.get(f"{BACKEND_URL}/calendar?date_from={date_from}&date_to={date_to}")
            if response.status_code == 200:
                events = response.json()
                if isinstance(events, list):
                    self.log_result('calendar_events', 'Filter events by date range', True)
                else:
                    self.log_result('calendar_events', 'Filter events by date range', False, 
                                  "Date range filter not working correctly")
            else:
                self.log_result('calendar_events', 'Filter events by date range', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('calendar_events', 'Filter events by date range', False, str(e))

        # Test 6: Test foreign key validation for calendar events
        invalid_event_data = {
            "website_id": str(uuid.uuid4()),
            "title": "This should fail",
            "date": date.today().isoformat(),
            "time": "12:00",
            "type": "generation"
        }
        try:
            response = self.session.post(f"{BACKEND_URL}/calendar", json=invalid_event_data)
            if response.status_code == 404:
                self.log_result('calendar_events', 'Validate calendar event website_id', True)
            else:
                self.log_result('calendar_events', 'Validate calendar event website_id', False, 
                              f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result('calendar_events', 'Validate calendar event website_id', False, str(e))

    def test_dashboard_stats_api(self):
        print("\n=== Testing Dashboard Stats API ===")
        
        # Test: Get dashboard statistics
        try:
            response = self.session.get(f"{BACKEND_URL}/stats")
            if response.status_code == 200:
                stats = response.json()
                required_fields = ['total_websites', 'total_posts', 'scheduled_posts', 'today_events']
                
                if all(field in stats for field in required_fields):
                    # Validate that all values are integers
                    if all(isinstance(stats[field], int) for field in required_fields):
                        self.log_result('dashboard_stats', 'Get dashboard statistics', True)
                    else:
                        self.log_result('dashboard_stats', 'Get dashboard statistics', False, 
                                      "Statistics values are not integers")
                else:
                    self.log_result('dashboard_stats', 'Get dashboard statistics', False, 
                                  f"Missing required fields: {required_fields}")
            else:
                self.log_result('dashboard_stats', 'Get dashboard statistics', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('dashboard_stats', 'Get dashboard statistics', False, str(e))

    def test_content_generation_api(self):
        print("\n=== Testing Content Generation API ===")
        
        # Ensure we have a website to reference
        if not self.created_resources['websites']:
            print("⚠️  No websites available for content generation testing, creating one...")
            self.test_website_management_api()
        
        if not self.created_resources['websites']:
            self.log_result('content_generation', 'Generate content', False, "No website available")
            return

        website_id = self.created_resources['websites'][0]
        
        # Test: Content generation (placeholder functionality)
        generation_data = {
            "website_id": website_id,
            "platform": "facebook",
            "prompt": "Create engaging content about Albanian innovation and technology",
            "tone": "professional",
            "length": "medium"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/generate-content", json=generation_data)
            if response.status_code == 200:
                result = response.json()
                required_fields = ['generated_content', 'platform', 'tone', 'length', 'ai_ready']
                
                if all(field in result for field in required_fields):
                    # Since this is a placeholder, we expect ai_ready to be False
                    if result['ai_ready'] == False:
                        self.log_result('content_generation', 'Content generation placeholder', True)
                    else:
                        self.log_result('content_generation', 'Content generation placeholder', False, 
                                      "Expected ai_ready to be False for placeholder")
                else:
                    self.log_result('content_generation', 'Content generation placeholder', False, 
                                  f"Missing required fields: {required_fields}")
            else:
                self.log_result('content_generation', 'Content generation placeholder', False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('content_generation', 'Content generation placeholder', False, str(e))

    def cleanup_test_data(self):
        print("\n=== Cleaning up test data ===")
        
        # Delete test posts
        for post_id in self.created_resources['posts']:
            try:
                response = self.session.delete(f"{BACKEND_URL}/posts/{post_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted post {post_id}")
                else:
                    print(f"⚠️  Failed to delete post {post_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️  Error deleting post {post_id}: {e}")

        # Delete test websites (this will also clean up related data)
        for website_id in self.created_resources['websites']:
            try:
                response = self.session.delete(f"{BACKEND_URL}/websites/{website_id}")
                if response.status_code == 200:
                    print(f"✅ Deleted website {website_id}")
                else:
                    print(f"⚠️  Failed to delete website {website_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️  Error deleting website {website_id}: {e}")

    def print_summary(self):
        print("\n" + "="*60)
        print("BACKEND API TESTING SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results['passed']
            failed = results['failed']
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"{category.upper().replace('_', ' ')}: {status} ({passed} passed, {failed} failed)")
            
            if results['errors']:
                for error in results['errors']:
                    print(f"  - {error}")
        
        print("-" * 60)
        overall_status = "✅ ALL TESTS PASSED" if total_failed == 0 else f"❌ {total_failed} TESTS FAILED"
        print(f"OVERALL: {overall_status} ({total_passed} passed, {total_failed} failed)")
        print("="*60)
        
        return total_failed == 0

    def run_all_tests(self):
        print("Starting comprehensive backend API testing...")
        print(f"Backend URL: {BACKEND_URL}")
        
        # Run all test suites
        self.test_website_management_api()
        self.test_social_posts_api()
        self.test_calendar_events_api()
        self.test_dashboard_stats_api()
        self.test_content_generation_api()
        
        # Print summary
        success = self.print_summary()
        
        # Cleanup
        self.cleanup_test_data()
        
        return success

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)