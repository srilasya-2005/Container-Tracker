#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class ContainerTradeAPITester:
    def __init__(self, base_url="https://trade-inventory-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.container_id = None
        self.sale_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_basic_api(self):
        """Test basic API endpoint"""
        return self.run_test("Basic API", "GET", "api", 200)

    def test_login_valid(self):
        """Test login with valid credentials"""
        success, response = self.run_test(
            "Login (Valid Credentials)",
            "POST",
            "api/auth/login",
            200,
            data={"email": "thelmhtrading@gmail.com", "password": "123456789"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token received: {self.token[:20]}...")
            return True
        return False

    def test_login_invalid(self):
        """Test login with invalid credentials"""
        return self.run_test(
            "Login (Invalid Credentials)",
            "POST",
            "api/auth/login",
            401,
            data={"email": "wrong@email.com", "password": "wrongpass"}
        )[0]

    def test_containers_list(self):
        """Test listing containers"""
        return self.run_test("List Containers", "GET", "api/containers", 200)

    def test_containers_list_with_filters(self):
        """Test listing containers with filters"""
        success1, _ = self.run_test("List Containers (Status Filter)", "GET", "api/containers?status=Available", 200)
        success2, _ = self.run_test("List Containers (Size Filter)", "GET", "api/containers?size=40FT", 200)
        success3, _ = self.run_test("List Containers (Type Filter)", "GET", "api/containers?type=Dry", 200)
        success4, _ = self.run_test("List Containers (Location Filter)", "GET", "api/containers?location=Oakland", 200)
        return success1 and success2 and success3 and success4

    def test_create_container(self):
        """Test creating a new container"""
        container_data = {
            "containerNo": f"TEST{datetime.now().strftime('%H%M%S')}",
            "size": "20FT",
            "type": "Dry",
            "purchasePrice": 2500,
            "purchaseDate": "2024-08-01",
            "location": "Test Location",
            "notes": "Test container for API testing"
        }
        
        success, response = self.run_test(
            "Create Container",
            "POST",
            "api/containers",
            201,
            data=container_data
        )
        
        if success and '_id' in response:
            self.container_id = response['_id']
            print(f"   Container ID: {self.container_id}")
            return True
        return False

    def test_get_container(self):
        """Test getting a single container"""
        if not self.container_id:
            print("❌ Skipped - No container ID available")
            return False
        
        return self.run_test(
            "Get Single Container",
            "GET",
            f"api/containers/{self.container_id}",
            200
        )[0]

    def test_update_container(self):
        """Test updating a container"""
        if not self.container_id:
            print("❌ Skipped - No container ID available")
            return False
        
        update_data = {
            "location": "Updated Test Location",
            "notes": "Updated notes for testing"
        }
        
        return self.run_test(
            "Update Container",
            "PUT",
            f"api/containers/{self.container_id}",
            200,
            data=update_data
        )[0]

    def test_create_duplicate_container(self):
        """Test creating container with duplicate number (should fail)"""
        duplicate_data = {
            "containerNo": "TELU1234567",  # This should already exist from seed data
            "size": "20FT",
            "type": "Dry",
            "purchasePrice": 2500,
            "purchaseDate": "2024-08-01",
            "location": "Test Location"
        }
        
        return self.run_test(
            "Create Duplicate Container (Should Fail)",
            "POST",
            "api/containers",
            400,
            data=duplicate_data
        )[0]

    def test_sales_list(self):
        """Test listing sales"""
        return self.run_test("List Sales", "GET", "api/sales", 200)

    def test_sales_list_with_filters(self):
        """Test listing sales with filters"""
        success1, _ = self.run_test("List Sales (Payment Status Filter)", "GET", "api/sales?paymentStatus=Full", 200)
        success2, _ = self.run_test("List Sales (Date Filter)", "GET", "api/sales?from=2024-01-01&to=2024-12-31", 200)
        return success1 and success2

    def test_create_sale(self):
        """Test creating a sale"""
        if not self.container_id:
            print("❌ Skipped - No container ID available")
            return False
        
        sale_data = {
            "containerId": self.container_id,
            "buyerName": "Test Buyer",
            "buyerPhone": "+1-555-TEST",
            "sellingPrice": 3000,
            "sellingDate": "2024-08-15",
            "paymentStatus": "Pending",
            "amountReceived": 0,
            "remarks": "Test sale for API testing"
        }
        
        success, response = self.run_test(
            "Create Sale",
            "POST",
            "api/sales",
            201,
            data=sale_data
        )
        
        if success and '_id' in response:
            self.sale_id = response['_id']
            print(f"   Sale ID: {self.sale_id}")
            return True
        return False

    def test_get_sale(self):
        """Test getting a single sale"""
        if not self.sale_id:
            print("❌ Skipped - No sale ID available")
            return False
        
        return self.run_test(
            "Get Single Sale",
            "GET",
            f"api/sales/{self.sale_id}",
            200
        )[0]

    def test_update_sale_payment(self):
        """Test updating sale payment details"""
        if not self.sale_id:
            print("❌ Skipped - No sale ID available")
            return False
        
        payment_update = {
            "paymentStatus": "Partial",
            "amountReceived": 1500,
            "remarks": "Partial payment received"
        }
        
        return self.run_test(
            "Update Sale Payment",
            "PUT",
            f"api/sales/{self.sale_id}",
            200,
            data=payment_update
        )[0]

    def test_create_sale_for_sold_container(self):
        """Test creating sale for already sold container (should fail)"""
        # Try to sell the same container again
        if not self.container_id:
            print("❌ Skipped - No container ID available")
            return False
        
        duplicate_sale_data = {
            "containerId": self.container_id,
            "buyerName": "Another Buyer",
            "buyerPhone": "+1-555-FAIL",
            "sellingPrice": 3500,
            "sellingDate": "2024-08-16",
            "paymentStatus": "Pending",
            "amountReceived": 0
        }
        
        return self.run_test(
            "Create Sale for Sold Container (Should Fail)",
            "POST",
            "api/sales",
            400,
            data=duplicate_sale_data
        )[0]

    def test_reports_summary(self):
        """Test reports summary"""
        success1, _ = self.run_test("Reports Summary (All)", "GET", "api/reports/summary", 200)
        success2, _ = self.run_test("Reports Summary (Date Filter)", "GET", "api/reports/summary?from=2024-01-01&to=2024-12-31", 200)
        return success1 and success2

    def test_reports_exports(self):
        """Test report exports"""
        # Note: These will return file downloads, we just check for no errors
        success1, _ = self.run_test("Export Containers Excel", "GET", "api/reports/export/containers.xlsx", 200)
        success2, _ = self.run_test("Export Sales Excel", "GET", "api/reports/export/sales.xlsx", 200)
        success3, _ = self.run_test("Export Summary PDF", "GET", "api/reports/export/summary.pdf", 200)
        return success1 and success2 and success3

    def test_delete_sold_container(self):
        """Test deleting sold container (should fail)"""
        if not self.container_id:
            print("❌ Skipped - No container ID available")
            return False
        
        return self.run_test(
            "Delete Sold Container (Should Fail)",
            "DELETE",
            f"api/containers/{self.container_id}",
            400
        )[0]

    def test_unauthorized_access(self):
        """Test accessing protected routes without token"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success = self.run_test(
            "Unauthorized Access (Should Fail)",
            "GET",
            "api/containers",
            401
        )[0]
        
        # Restore token
        self.token = original_token
        return success

def main():
    print("🚀 Starting Container Trade Tracker API Tests")
    print("=" * 60)
    
    tester = ContainerTradeAPITester()
    
    # Test sequence
    tests = [
        ("Basic API", tester.test_basic_api),
        ("Valid Login", tester.test_login_valid),
        ("Invalid Login", tester.test_login_invalid),
        ("Unauthorized Access", tester.test_unauthorized_access),
        ("List Containers", tester.test_containers_list),
        ("Container Filters", tester.test_containers_list_with_filters),
        ("Create Container", tester.test_create_container),
        ("Get Container", tester.test_get_container),
        ("Update Container", tester.test_update_container),
        ("Duplicate Container", tester.test_create_duplicate_container),
        ("List Sales", tester.test_sales_list),
        ("Sales Filters", tester.test_sales_list_with_filters),
        ("Create Sale", tester.test_create_sale),
        ("Get Sale", tester.test_get_sale),
        ("Update Sale Payment", tester.test_update_sale_payment),
        ("Duplicate Sale", tester.test_create_sale_for_sold_container),
        ("Delete Sold Container", tester.test_delete_sold_container),
        ("Reports Summary", tester.test_reports_summary),
        ("Reports Exports", tester.test_reports_exports),
    ]
    
    print(f"\n📋 Running {len(tests)} test categories...")
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test category '{test_name}' failed with exception: {str(e)}")
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())