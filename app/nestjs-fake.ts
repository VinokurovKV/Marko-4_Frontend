// TODO: it's done to fix bug with combination of @nestjs/swagger, class-transformer and Vite (https://stackoverflow.com/questions/70802610/module-not-found-error-cant-resolve-class-transformer-storage-angular-uni)

//import { IntersectionType }

// function IntersectionType(...classRefs) {
//   class IntersectionClassType {
//     constructor() {
//       classRefs.forEach((classRef) => {
//         ;(0, mapped_types_1.inheritPropertyInitializers)(this, classRef)
//       })
//     }
//   }
//   classRefs.forEach((classRef) => {
//     const fields = modelPropertiesAccessor.getModelProperties(
//       classRef.prototype
//     )
//     ;(0, mapped_types_1.inheritValidationMetadata)(
//       classRef,
//       IntersectionClassType
//     )
//     ;(0, mapped_types_1.inheritTransformationMetadata)(
//       classRef,
//       IntersectionClassType
//     )
//     function applyFields(fields) {
//       ;(0, mapped_types_utils_1.clonePluginMetadataFactory)(
//         IntersectionClassType,
//         classRef.prototype
//       )
//       fields.forEach((propertyKey) => {
//         const metadata = Reflect.getMetadata(
//           constants_1.DECORATORS.API_MODEL_PROPERTIES,
//           classRef.prototype,
//           propertyKey
//         )
//         const decoratorFactory = (0, decorators_1.ApiProperty)(metadata)
//         decoratorFactory(IntersectionClassType.prototype, propertyKey)
//       })
//     }
//     applyFields(fields)
//     metadata_loader_1.MetadataLoader.addRefreshHook(() => {
//       const fields = modelPropertiesAccessor.getModelProperties(
//         classRef.prototype
//       )
//       applyFields(fields)
//     })
//   })
//   const intersectedNames = classRefs.reduce((prev, ref) => prev + ref.name, '')
//   Object.defineProperty(IntersectionClassType, 'name', {
//     value: `Intersection${intersectedNames}`
//   })
//   return IntersectionClassType
// }
