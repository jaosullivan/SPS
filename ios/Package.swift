// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MemberSignIn",
    products: [
        .library(name: "MemberSignIn", targets: ["MemberSignIn"]),
    ],
    targets: [
        .target(name: "MemberSignIn"),
        .testTarget(
            name: "MemberSignInTests",
            dependencies: ["MemberSignIn"]
        ),
    ]
)
